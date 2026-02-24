import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/Topbar";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "WITH_OBSERVATIONS", label: "Con observaciones" },
  { value: "APPROVED", label: "Aprobado" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is a global consultor
  const { data: isConsultor } = useQuery({
    queryKey: ["isConsultor", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_members")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "CONSULTOR")
        .limit(1);
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", isConsultor],
    queryFn: async () => {
      if (isConsultor) {
        // Consultors see ALL projects
        const { data: allProjects } = await supabase
          .from("projects")
          .select("*, organizations(name)")
          .is("deleted_at", null)
          .order("updated_at", { ascending: false });

        // Fetch comment counts per project to show who commented
        const projectIds = (allProjects || []).map((p) => p.id);
        const { data: commentsData } = await supabase
          .from("comments")
          .select("project_id, author_id, status")
          .in("project_id", projectIds)
          .is("deleted_at", null)
          .eq("status", "PENDING");

        const commentCountMap: Record<string, number> = {};
        (commentsData || []).forEach((c) => {
          commentCountMap[c.project_id] = (commentCountMap[c.project_id] || 0) + 1;
        });

        return (allProjects || []).map((p) => ({
          ...p,
          role: "CONSULTOR" as const,
          organizationName: (p as any).organizations?.name,
          commentCount: commentCountMap[p.id] || 0,
        }));
      } else {
        // Formuladores see only their projects
        const { data: memberships } = await supabase
          .from("project_members")
          .select("project_id, role")
          .eq("user_id", user!.id);

        if (!memberships?.length) return [];

        const projectIds = memberships.map((m) => m.project_id);
        const roleMap = Object.fromEntries(memberships.map((m) => [m.project_id, m.role]));

        const { data: projects } = await supabase
          .from("projects")
          .select("*, organizations(name)")
          .in("id", projectIds)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false });

        // Fetch comment counts
        const { data: commentsData } = await supabase
          .from("comments")
          .select("project_id, status")
          .in("project_id", projectIds)
          .is("deleted_at", null)
          .eq("status", "PENDING");

        const commentCountMap: Record<string, number> = {};
        (commentsData || []).forEach((c) => {
          commentCountMap[c.project_id] = (commentCountMap[c.project_id] || 0) + 1;
        });

        return (projects || []).map((p) => ({
          ...p,
          role: roleMap[p.id],
          organizationName: (p as any).organizations?.name,
          commentCount: commentCountMap[p.id] || 0,
        }));
      }
    },
    enabled: !!user && isConsultor !== undefined,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("Sesión no válida. Vuelve a iniciar sesión.");
      }

      const currentUserId = authData.user.id;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: "Mi organización" })
        .select()
        .single();

      if (orgError || !org) throw orgError ?? new Error("No se pudo crear la organización");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          title: "Nuevo Proyecto",
          organization_id: org.id,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (error || !project) throw error ?? new Error("No se pudo crear el proyecto");

      const { error: memberError } = await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: currentUserId,
        role: "FORMULADOR",
        is_owner: true,
        joined_at: new Date().toISOString(),
      });

      if (memberError) throw memberError;

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate(`/projects/${project!.id}/edit`);
    },
    onError: (error: any) => {
      toast({ title: "Error al crear proyecto", description: error.message, variant: "destructive" });
    },
  });

  const filtered = projects.filter((p: any) => {
    const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display text-foreground">
              {isConsultor ? "Todos los Proyectos" : "Mis Proyectos"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isConsultor
                ? "Revisa y comenta los proyectos formulados"
                : "Gestiona y formula tus proyectos de IA y ciencia de datos"}
            </p>
          </div>
          {!isConsultor && (
            <Button onClick={() => createProject.mutate()} disabled={createProject.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proyecto
            </Button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Project grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-accent p-4 mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-xl text-foreground mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {isConsultor
                ? "Aún no hay proyectos formulados para revisar."
                : "Crea tu primer proyecto para comenzar a formular con la metodología GobLab UAI."}
            </p>
            {!isConsultor && (
              <Button onClick={() => createProject.mutate()}>
                <Plus className="mr-2 h-4 w-4" /> Crear proyecto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: any) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                title={p.title}
                organizationName={p.organizationName}
                status={p.status}
                completionPct={p.completion_pct}
                updatedAt={p.updated_at}
                commentCount={p.commentCount}
                role={p.role}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t pt-6 pb-8 text-xs text-muted-foreground text-center">
          Esta ficha fue desarrollada originalmente por el Center for Data Science and Public Policy de la Universidad de Chicago y el GobLab UAI, en colaboración con CMU, ITAM y CoDaTecs/Universidad Nacional del Rosario. Licencia CC BY-SA 3.0 · goblab.uai.cl
        </footer>
      </main>
    </div>
  );
}
