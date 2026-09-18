import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BUCKET = "project-pdfs";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

const BodySchema = z.object({
  project_id: z.string().uuid(),
  file_name: z.string().min(1).max(200),
  pdf_base64: z.string().min(100).max(40_000_000),
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ._ -]/g, "").trim() || "proyecto";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ── 1. Session ──
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "No autenticado" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json({ error: "No autenticado" }, 401);

  // ── 2. Input ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { project_id, file_name, pdf_base64 } = parsed.data;

  const admin = createClient(supabaseUrl, serviceKey);

  // ── 3. Permission on this project (server-side, with the caller's identity) ──
  const { data: canView, error: canViewError } = await admin.rpc("can_view_project", {
    _user_id: user.id,
    _project_id: project_id,
  });
  if (canViewError) return json({ error: "No se pudo verificar el permiso" }, 500);
  if (canView !== true) return json({ error: "No tienes acceso a este proyecto" }, 403);

  // ── 4. Project must be APPROVED ──
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id, status, deleted_at")
    .eq("id", project_id)
    .maybeSingle();
  if (projectError) return json({ error: "No se pudo leer el proyecto" }, 500);
  if (!project || project.deleted_at) return json({ error: "Proyecto no encontrado" }, 404);
  if (project.status !== "APPROVED") {
    return json({ error: "El proyecto debe estar aprobado para exportarlo" }, 403);
  }

  // ── 5. Decode PDF ──
  let bytes: Uint8Array;
  try {
    const binary = atob(pdf_base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch {
    return json({ error: "Documento inválido" }, 400);
  }
  if (bytes.length < 100 || String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") {
    return json({ error: "Documento inválido" }, 400);
  }

  // ── 6. Remove previous copies for this project, keep only the current one ──
  const { data: existing } = await admin.storage.from(BUCKET).list(project_id);
  if (existing?.length) {
    await admin.storage
      .from(BUCKET)
      .remove(existing.map((f) => `${project_id}/${f.name}`));
  }

  // ── 7. Store the current copy ──
  const safeName = sanitizeFileName(file_name);
  const objectPath = `${project_id}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(objectPath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return json({ error: "No se pudo preparar la descarga" }, 500);

  // ── 8. Short-lived signed URL that forces a download (Content-Disposition: attachment) ──
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS, { download: safeName });
  if (signError || !signed?.signedUrl) {
    return json({ error: "No se pudo generar el enlace de descarga" }, 500);
  }

  return json({ url: signed.signedUrl, file_name: safeName, expires_in: SIGNED_URL_TTL_SECONDS }, 200);
});
