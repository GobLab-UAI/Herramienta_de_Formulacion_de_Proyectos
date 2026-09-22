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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "No autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller.user) return json({ error: "Sesión inválida" }, 401);

    const { data: callerRole } = await admin
      .from("user_roles").select("role").eq("user_id", caller.user.id).maybeSingle();
    if (callerRole?.role !== "ADMIN") {
      return json({ error: "Solo el Superadmin puede eliminar cuentas" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body.user_id ?? "").trim();
    if (!UUID.test(userId)) return json({ error: "Identificador de usuario inválido" }, 400);
    if (userId === caller.user.id) return json({ error: "No puedes eliminar tu propia cuenta" }, 400);

    const { data: targetRole } = await admin
      .from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (targetRole?.role === "ADMIN") {
      return json({ error: "No se puede eliminar otra cuenta Superadmin" }, 400);
    }

    const { data: targetProfile } = await admin
      .from("profiles").select("id, username").eq("id", userId).maybeSingle();

    // Projects keep existing (they belong to the team); only the person's data is removed.
    await admin.from("project_members").delete().eq("user_id", userId);
    await admin.from("user_folder_projects").delete().eq("user_id", userId);
    await admin.from("user_folders").delete().eq("user_id", userId);
    await admin.from("notifications").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) return json({ error: deleteError.message }, 400);

    return json({ message: "ok", userId, username: targetProfile?.username ?? null });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
