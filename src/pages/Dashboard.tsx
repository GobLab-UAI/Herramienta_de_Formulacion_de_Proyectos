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
  const { user, isConsultor, profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.id, isConsultor, showDeleted],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, organizations(name)")
        .order("updated_at", { ascending: false });

      if (showDeleted && isConsultor) {
        query = query.not("deleted_at", "is", null);
      } else {
        query = query.is("deleted_at", null);
      }

      if (!isConsultor && user) {
        query = query.eq("created_by", user.id);
      }

      const { data: allProjects } = await query;
      const projectIds = (allProjects || []).map((p) => p.id);
      if (projectIds.length === 0) return [];

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

      let creatorMap: Record<string, string> = {};
      if (isConsultor) {
        const creatorIds = [...new Set((allProjects || []).map((p) => p.created_by))];
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, username")
            .in("id", creatorIds);
          (profiles || []).forEach((p) => {
            creatorMap[p.id] = p.full_name || p.username;
          });
        }
      }

      return (allProjects || []).map((p) => ({
        ...p,
        organizationName: (p as any).organizations?.name,
        commentCount: commentCountMap[p.id] || 0,
        creatorName: creatorMap[p.created_by] || undefined,
        isDeleted: !!p.deleted_at,
      }));
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const orgName = profile?.entidad?.trim() || "Mi organización";
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName })
        .select()
        .single();
      if (orgError || !org) throw orgError ?? new Error("No se pudo crear la organización");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({ title: "Nuevo Proyecto", organization_id: org.id, created_by: user!.id })
        .select()
        .single();
      if (error || !project) throw error ?? new Error("No se pudo crear el proyecto");
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

  const softDelete = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Proyecto eliminado" });
    },
  });

  const restoreProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: null })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Proyecto restaurado" });
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: "DRAFT" | "IN_REVIEW" | "WITH_OBSERVATIONS" | "APPROVED" | "ARCHIVED" }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Estado actualizado" });
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
              {isConsultor ? (showDeleted ? "Proyectos Eliminados" : "Todos los Proyectos") : "Mis Proyectos"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isConsultor
                ? showDeleted
                  ? "Proyectos que han sido eliminados por los formuladores"
                  : "Revisa y comenta los proyectos formulados"
                : "Gestiona y formula tus proyectos de IA y ciencia de datos"}
            </p>
          </div>
          <div className="flex gap-2">
            {isConsultor && (
              <Button variant={showDeleted ? "default" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
                {showDeleted ? "Ver activos" : "Ver eliminados"}
              </Button>
            )}
            {!isConsultor && (
              <Button onClick={() => createProject.mutate()} disabled={createProject.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
              </Button>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar proyectos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {!showDeleted && (
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} variant={statusFilter === f.value ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(f.value)} className="text-xs">
                  {f.label}
                </Button>
              ))}
            </div>
          )}
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
            <h3 className="font-display text-xl text-foreground mb-2">
              {showDeleted ? "No hay proyectos eliminados" : "No hay proyectos"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {showDeleted
                ? "Ningún formulador ha eliminado proyectos."
                : isConsultor
                  ? "Aún no hay proyectos formulados para revisar."
                  : "Crea tu primer proyecto para comenzar a formular con la metodología GobLab UAI."}
            </p>
            {!isConsultor && !showDeleted && (
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
                completionPct={p.completionPct ?? p.completion_pct}
                updatedAt={p.updated_at}
                commentCount={p.commentCount}
                role={isConsultor ? "CONSULTOR" : "FORMULADOR"}
                creatorName={p.creatorName}
                isDeleted={p.isDeleted}
                onDelete={(id) => softDelete.mutate(id)}
                onRestore={(id) => restoreProject.mutate(id)}
                onSendToReview={(id) => changeStatus.mutate({ projectId: id, status: "IN_REVIEW" })}
                onApprove={(id) => changeStatus.mutate({ projectId: id, status: "APPROVED" })}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 border-t pt-6 pb-8 text-xs text-muted-foreground text-center">
          Fue creada en 2019 en el marco de un proyecto de innovación del GobLab titulado "Ciencia de Datos para Directivos Públicos" con financiamiento del Laboratorio de Gobierno y Servicio Civil, en colaboración con el Center for Data Science and Public Policy de la Universidad de Chicago. Licencia CC BY-SA 3.0 · goblab.uai.cl
        </footer>
      </main>
    </div>
  );
}
