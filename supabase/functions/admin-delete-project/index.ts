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
      return json({ error: "Solo el Superadmin puede eliminar proyectos definitivamente" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const projectId = String(body.project_id ?? "").trim();
    if (!UUID.test(projectId)) return json({ error: "Identificador de proyecto inválido" }, 400);

    const { data: project } = await admin
      .from("projects").select("id, title").eq("id", projectId).maybeSingle();
    if (!project) return json({ error: "El proyecto no existe" }, 404);

    // Remove stored PDFs for this project (best effort)
    try {
      const { data: files } = await admin.storage.from("project-pdfs").list(projectId);
      if (files && files.length > 0) {
        await admin.storage.from("project-pdfs").remove(files.map((f) => `${projectId}/${f.name}`));
      }
    } catch {
      // ignore storage cleanup errors
    }

    await admin.from("comments").delete().eq("project_id", projectId);
    await admin.from("form_responses").delete().eq("project_id", projectId);
    await admin.from("field_history").delete().eq("project_id", projectId);
    await admin.from("notifications").delete().eq("project_id", projectId);
    await admin.from("user_folder_projects").delete().eq("project_id", projectId);
    await admin.from("project_members").delete().eq("project_id", projectId);

    const { error: deleteError } = await admin.from("projects").delete().eq("id", projectId);
    if (deleteError) return json({ error: deleteError.message }, 400);

    return json({ message: "ok", projectId, title: project.title });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
