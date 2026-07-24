import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyProjects from "./tools/list-my-projects";
import getProject from "./tools/get-project";
import listProjectComments from "./tools/list-project-comments";
import addComment from "./tools/add-comment";

// Build the OAuth issuer from the Supabase project ref (Vite inlines this at build time).
// Must be the direct supabase.co host — mcp-js rejects any token whose configured issuer
// doesn't match the one the discovery document publishes.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "goblab-eval-mcp",
  title: "Herramienta de Evaluación de Proyectos de IA",
  version: "0.1.0",
  instructions:
    "Tools to browse and comment on AI-project evaluations built in the GobLab IA evaluation portal. Use `list_my_projects` to discover projects the signed-in user can access, `get_project` to read a project's saved form answers, `list_project_comments` to read observations, and `add_comment` to leave a new observation on a specific field.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyProjects, getProject, listProjectComments, addComment],
});