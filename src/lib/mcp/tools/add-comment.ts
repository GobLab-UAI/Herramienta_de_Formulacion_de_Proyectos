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
  name: "add_comment",
  title: "Add a comment on a field",
  description:
    "Add a comment (observation) on a specific field of a project. The author is always the signed-in user; text is required.",
  inputSchema: {
    project_id: z.string().uuid().describe("Project UUID."),
    field_key: z.string().min(1).describe("Field key the comment refers to (e.g. 'p-1', 'obj-1')."),
    text: z.string().trim().min(1).describe("Comment text."),
    parent_id: z.string().uuid().optional().describe("Optional parent comment id when replying to a thread."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ project_id, field_key, text, parent_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await sb(ctx)
      .from("comments")
      .insert({
        project_id,
        field_key,
        text,
        parent_id: parent_id ?? null,
        author_id: ctx.getUserId()!,
      })
      .select("id, project_id, field_key, author_id, text, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Comment created: ${data.id}` }],
      structuredContent: { comment: data },
    };
  },
});