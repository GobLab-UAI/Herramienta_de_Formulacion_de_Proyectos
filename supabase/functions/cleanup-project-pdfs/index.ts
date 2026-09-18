import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKET = "project-pdfs";
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = Date.now() - MAX_AGE_MS;
  const stale: string[] = [];

  const { data: folders, error } = await admin.storage.from(BUCKET).list("", { limit: 1000 });
  if (error) {
    return new Response(JSON.stringify({ error: "No se pudo listar el almacenamiento" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const folder of folders ?? []) {
    const { data: files } = await admin.storage.from(BUCKET).list(folder.name, { limit: 1000 });
    for (const file of files ?? []) {
      const created = new Date(file.created_at ?? file.updated_at ?? 0).getTime();
      if (!created || created < cutoff) stale.push(`${folder.name}/${file.name}`);
    }
  }

  if (stale.length) await admin.storage.from(BUCKET).remove(stale);

  return new Response(JSON.stringify({ removed: stale.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
