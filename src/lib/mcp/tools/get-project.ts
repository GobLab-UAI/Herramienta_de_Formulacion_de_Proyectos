import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_project",
  title: "Get project details",
  description:
    "Return a single project's metadata plus its saved form responses (per field key). The caller must have access to the project via ownership, membership or being a consultant.",
  inputSchema: {
    project_id: z.string().uuid().describe("Project UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = sb(ctx);
    const [projectRes, responsesRes] = await Promise.all([
      client
        .from("projects")
        .select("id, title, status, join_code, completion_pct, created_at, updated_at, created_by")
        .eq("id", project_id)
        .is("deleted_at", null)
        .maybeSingle(),
      client
        .from("form_responses")
        .select("field_key, field_value, table_data, updated_at, updated_by")
        .eq("project_id", project_id),
    ]);
    if (projectRes.error) {
      return { content: [{ type: "text", text: projectRes.error.message }], isError: true };
    }
    if (!projectRes.data) {
      return { content: [{ type: "text", text: "Project not found or access denied." }], isError: true };
    }
    if (responsesRes.error) {
      return { content: [{ type: "text", text: responsesRes.error.message }], isError: true };
    }
    const payload = { project: projectRes.data, responses: responsesRes.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});