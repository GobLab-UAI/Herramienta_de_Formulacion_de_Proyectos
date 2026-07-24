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
  name: "list_project_comments",
  title: "List project comments",
  description:
    "List comments (observations) left on a project. Optionally filter by field_key. Returns author id, field key, text, status and timestamps.",
  inputSchema: {
    project_id: z.string().uuid().describe("Project UUID."),
    field_key: z.string().optional().describe("Optional field key to filter (e.g. 'p-1', 'eth-dat3')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, field_key }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = sb(ctx)
      .from("comments")
      .select("id, project_id, field_key, author_id, text, status, parent_id, created_at, updated_at")
      .eq("project_id", project_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (field_key) query = query.eq("field_key", field_key);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { comments: data ?? [] },
    };
  },
});