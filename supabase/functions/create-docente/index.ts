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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "No recibimos los datos del formulario. Intenta de nuevo." }, 400);
    }

    const full_name = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!full_name) return json({ error: "Escribe el nombre completo del docente" }, 400);
    if (!email) return json({ error: "Escribe el correo del docente" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return json({ error: "El correo no tiene un formato válido (ej. ana@uai.cl)" }, 400);
    }
    if (!username) return json({ error: "Escribe el nombre de usuario" }, 400);
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return json({
        error: "El usuario debe tener entre 3 y 30 caracteres, sin espacios ni acentos (letras, números, . _ -)",
      }, 400);
    }
    if (password.length < 8) {
      return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    // Duplicate checks: separate queries so multiple matches never break the lookup
    const { data: emailTaken, error: emailLookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1);
    if (emailLookupError) {
      return json({ error: "No pudimos verificar el correo. Intenta de nuevo." }, 500);
    }
    if (emailTaken && emailTaken.length > 0) {
      return json({ error: `Ya existe una cuenta con el correo ${email}` }, 409);
    }

    const { data: usernameTaken, error: usernameLookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1);
    if (usernameLookupError) {
      return json({ error: "No pudimos verificar el usuario. Intenta de nuevo." }, 500);
    }
    if (usernameTaken && usernameTaken.length > 0) {
      return json({ error: `El nombre de usuario "${username}" ya está en uso` }, 409);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, username },
    });
    if (createError || !created?.user) {
      const raw = (createError?.message ?? "").toLowerCase();
      if (raw.includes("already") || raw.includes("registered") || raw.includes("exists")) {
        return json({ error: `Ya existe una cuenta con el correo ${email}` }, 409);
      }
      if (raw.includes("password")) {
        return json({ error: "La contraseña no cumple los requisitos mínimos" }, 400);
      }
      if (raw.includes("email")) {
        return json({ error: "El correo no es válido o no está permitido" }, 400);
      }
      return json({ error: createError?.message || "No se pudo crear la cuenta" }, 400);
    }

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
