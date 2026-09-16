import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "No autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the caller and require the ADMIN (Superadmin) role
    const token = authHeader.replace("Bearer ", "");
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller.user) return json({ error: "Sesión inválida" }, 401);

    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.user.id)
      .maybeSingle();

    if (callerRole?.role !== "ADMIN") {
      return json({ error: "Solo el Superadmin puede crear cuentas docente" }, 403);
    }

    const body = await req.json();
    const full_name = (body.full_name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const username = (body.username ?? "").trim();
    const password = body.password ?? "";

    if (!full_name || !email || !username || !password) {
      return json({ error: "Nombre, correo, usuario y contraseña son obligatorios" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();
    if (taken) return json({ error: "Ese usuario o correo ya existe" }, 409);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, username },
    });
    if (createError) return json({ error: createError.message }, 400);

    const userId = created.user.id;

    // The signup trigger assigns FORMULADOR by default; promote to DOCENTE.
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleRow) {
      await admin.from("user_roles").update({ role: "DOCENTE" }).eq("user_id", userId);
    } else {
      await admin.from("user_roles").insert({ user_id: userId, role: "DOCENTE" });
    }

    return json({ message: "ok", userId, username, email });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
