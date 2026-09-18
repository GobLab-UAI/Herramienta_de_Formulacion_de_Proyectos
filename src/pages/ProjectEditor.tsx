import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logoHerramientas from "@/assets/logo-herramientas-eticas.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { QuestionBlock } from "@/components/editor/QuestionBlock";
import { DynamicTable } from "@/components/editor/DynamicTable";
import { CommentBubble } from "@/components/editor/CommentBubble";
import { CommentHistorySidebar } from "@/components/editor/CommentHistorySidebar";
import { FORM_SECTIONS, REQUIRED_FIELDS, todayLocalISO, type FormField, type TableConfig } from "@/lib/formSections";
import { Save, ArrowLeft, MessageSquare, PanelRightOpen, FileDown, Send, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateProjectPDF } from "@/lib/exportPdf";
import { Link } from "react-router-dom";
import { TeamPanel } from "@/components/team/TeamPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SaveStatus = "saved" | "saving" | "error" | "unsaved";

export default function ProjectEditor({ reviewMode = false }: { reviewMode?: boolean }) {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, isConsultor: roleIsConsultor, isDocente, isSuperadmin } = useAuth();
  const currentUserId = user?.id || "";
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isConsultor = (reviewMode || roleIsConsultor) && !isDocente;

  // Membership of the current user in this project (for COMENTARISTA role)
  const { data: myMembership } = useQuery({
    queryKey: ["my-membership", projectId, currentUserId],
    queryFn: async () => {
      if (!currentUserId || !projectId) return null;
      const { data } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!projectId && !!currentUserId,
  });
  const isCommenter = myMembership?.role === "COMENTARISTA";
  // Docentes always browse in read-only mode, but they can comment.
  const isReadOnly = isConsultor || isCommenter || isDocente;
  const canComment = isConsultor || isCommenter || isDocente;

  const [activeSection, setActiveSection] = useState(FORM_SECTIONS[0].id);
  const [title, setTitle] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const pendingChanges = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Record<string, any>>({});

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const { base64, fileName } = generateProjectPDF(title, responses);
      const { data, error } = await supabase.functions.invoke("export-project-pdf", {
        body: { project_id: projectId, file_name: fileName, pdf_base64: base64 },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("Sin enlace de descarga");
      // The signed URL is served with Content-Disposition: attachment, so this
      // downloads the file in every browser (Chrome, Safari, Safari iOS) without
      // opening a tab, navigating away, or relying on blob URLs.
      window.location.href = url;
    } catch (e: any) {
      toast({
        title: "No se pudo generar el PDF",
        description: e?.message || "Vuelve a intentarlo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Build field labels map
  const fieldLabels = useMemo(() => {
    const map: Record<string, string> = {};
    FORM_SECTIONS.forEach((s) => {
      s.fields.forEach((f: FormField | TableConfig) => {
        map[f.key] = f.label || f.key;
      });
    });
    return map;
  }, []);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch responses
  const { data: formResponses } = useQuery({
    queryKey: ["responses", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("form_responses")
        .select("field_key, field_value, table_data")
        .eq("project_id", projectId!);
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch project members (for role enrichment in comments/history)
  const { data: memberMap = {} } = useQuery<Record<string, { name: string; role: string }>>({
    queryKey: ["member-map", projectId],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("project_members")
        .select("user_id, custom_role")
        .eq("project_id", projectId!);
      const ids = (rows || []).map((r) => r.user_id);
      if (ids.length === 0) return {};
      const { data: profiles } = await supabase
        .from("profiles").select("id, full_name, username").in("id", ids);
      const pmap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      const out: Record<string, { name: string; role: string }> = {};
      (rows || []).forEach((r) => {
        const p = pmap[r.user_id];
        out[r.user_id] = {
          name: p?.full_name || p?.username || "Usuario",
          role: r.custom_role || "Miembro",
        };
      });
      return out;
    },
    enabled: !!projectId,
  });

  // Fetch active comments (not deleted)
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", projectId, Object.keys(memberMap).length],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, field_key, author_id, text, status, resolved_by, resolved_at, created_at, parent_id, deleted_at")
        .eq("project_id", projectId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      return (data || []).map((c) => ({
        ...c,
        author_name: memberMap[c.author_id]
          ? `${memberMap[c.author_id].name} · ${memberMap[c.author_id].role}`
          : (isConsultor ? "Consultor" : "Formulador"),
        resolved_by_name: c.resolved_by ? (memberMap[c.resolved_by]?.name || "Usuario") : undefined,
      }));
    },
    enabled: !!projectId,
  });

  // Fetch ALL comments for history (including deleted and resolved)
  const { data: allComments = [] } = useQuery({
    queryKey: ["allComments", projectId, Object.keys(memberMap).length],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, field_key, author_id, text, status, resolved_by, resolved_at, created_at, parent_id, deleted_at")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });

      return (data || []).map((c) => ({
        ...c,
        author_name: memberMap[c.author_id]
          ? `${memberMap[c.author_id].name} · ${memberMap[c.author_id].role}`
          : "Usuario",
        resolved_by_name: c.resolved_by ? (memberMap[c.resolved_by]?.name || "Usuario") : undefined,
      }));
    },
    enabled: !!projectId,
  });

  // Fetch field change history
  const { data: fieldHistory = [] } = useQuery({
    queryKey: ["fieldHistory", projectId, Object.keys(memberMap).length],
    queryFn: async () => {
      const { data } = await supabase
        .from("field_history")
        .select("id, field_key, old_value, new_value, changed_by, changed_at")
        .eq("project_id", projectId!)
        .order("changed_at", { ascending: false })
        .limit(500);
      return (data || []).map((h) => ({
        ...h,
        author_name: memberMap[h.changed_by]
          ? `${memberMap[h.changed_by].name} · ${memberMap[h.changed_by].role}`
          : "Usuario",
      }));
    },
    enabled: !!projectId,
  });

  // Initialize state
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setResponses((prev) => {
        if (!prev["portada-nombre"] && project.title) {
          return { ...prev, "portada-nombre": project.title };
        }
        return prev;
      });
    }
  }, [project]);

  useEffect(() => {
    if (formResponses) {
      const resp: Record<string, any> = {};
      formResponses.forEach((r) => {
        resp[r.field_key] = r.table_data || r.field_value || "";
      });
      lastSavedRef.current = { ...resp };

      // The cover date shows a default value on screen; make it a real stored
      // answer so the exported PDF always matches what the user sees.
      if (!resp["portada-fecha"] && !isReadOnly) {
        resp["portada-fecha"] = todayLocalISO();
        pendingChanges.current.add("portada-fecha");
        setSaveStatus("unsaved");
      }
      setResponses(resp);
    }
  }, [formResponses, isReadOnly]);

  // Comment counts
  const commentCounts: Record<string, number> = {};
  comments.forEach((c: any) => {
    if (c.status === "PENDING" && !c.parent_id) {
      commentCounts[c.field_key] = (commentCounts[c.field_key] || 0) + 1;
    }
  });

  const commentsByField: Record<string, any[]> = {};
  comments.forEach((c: any) => {
    if (!commentsByField[c.field_key]) commentsByField[c.field_key] = [];
    commentsByField[c.field_key].push(c);
  });

  const totalPendingComments = Object.values(commentCounts).reduce((a, b) => a + b, 0);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      const keys = Array.from(pendingChanges.current);
      if (keys.length === 0) return;
      setSaveStatus("saving");
      const historyRows: any[] = [];
      const upserts = keys.map((key) => {
        const value = responses[key];
        const isTable = typeof value === "object" && value !== null;
        const prev = lastSavedRef.current[key];
        const oldStr = prev == null ? "" : (typeof prev === "object" ? JSON.stringify(prev) : String(prev));
        const newStr = value == null ? "" : (isTable ? JSON.stringify(value) : String(value));
        if (oldStr !== newStr) {
          historyRows.push({
            project_id: projectId!,
            field_key: key,
            old_value: oldStr || null,
            new_value: newStr || null,
            changed_by: currentUserId,
          });
        }
        return {
          project_id: projectId!,
          field_key: key,
          field_value: isTable ? null : (value as string) || null,
          table_data: isTable ? value : null,
          updated_by: currentUserId,
        };
      });
      for (const upsert of upserts) {
        const { error } = await supabase
          .from("form_responses")
          .upsert(upsert, { onConflict: "project_id,field_key" });
        if (error) throw error;
      }
      if (historyRows.length > 0) {
        await supabase.from("field_history").insert(historyRows);
      }
      keys.forEach((k) => { lastSavedRef.current[k] = responses[k]; });
      const filledCount = REQUIRED_FIELDS.filter((key) => {
        const val = responses[key];
        if (typeof val === "string") return val.length > 10;
        if (val && typeof val === "object") return true;
        return false;
      }).length;
      const pct = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);
      await supabase.from("projects").update({ completion_pct: pct }).eq("id", projectId!);
      pendingChanges.current.clear();
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["fieldHistory", projectId] });
    },
    onError: () => {
      setSaveStatus("error");
      toast({ title: "Error al guardar", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    },
  });

  const flushSave = useCallback(() => {
    if (pendingChanges.current.size > 0) saveMutation.mutate();
  }, [saveMutation]);

  useEffect(() => {
    saveTimerRef.current = setInterval(() => flushSave(), 30000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [flushSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); flushSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flushSave]);

  const updateField = (key: string, value: any) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
    pendingChanges.current.add(key);
    setSaveStatus("unsaved");
    if (key === "portada-nombre" && typeof value === "string") {
      updateTitle(value);
    }
  };

  // Comments
  const addComment = async (fieldKey: string, text: string) => {
    await supabase.from("comments").insert({ project_id: projectId!, field_key: fieldKey, author_id: currentUserId, text });
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["allComments", projectId] });
  };

  const replyToComment = async (parentId: string, fieldKey: string, text: string) => {
    await supabase.from("comments").insert({
      project_id: projectId!,
      field_key: fieldKey,
      author_id: currentUserId,
      text,
      parent_id: parentId,
    });
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["allComments", projectId] });
  };

  const resolveComment = async (commentId: string) => {
    await supabase.from("comments").update({ status: "RESOLVED" as any, resolved_by: currentUserId, resolved_at: new Date().toISOString() }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["allComments", projectId] });
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").update({ deleted_at: new Date().toISOString() }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["allComments", projectId] });
  };

  const updateTitle = async (newTitle: string) => {
    setTitle(newTitle);
    // Sync to the form field "portada-nombre" so both stay in sync
    setResponses((prev) => {
      if (prev["portada-nombre"] === newTitle) return prev;
      return { ...prev, "portada-nombre": newTitle };
    });
    pendingChanges.current.add("portada-nombre");
    setSaveStatus("unsaved");
    await supabase.from("projects").update({ title: newTitle }).eq("id", projectId!);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFieldComment = (fieldKey: string) => {
    setActiveCommentField(activeCommentField === fieldKey ? null : fieldKey);
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground" },
    IN_REVIEW: { label: "En revisión", className: "bg-amber-bg text-amber border-amber/30" },
    WITH_OBSERVATIONS: { label: "Con observaciones", className: "bg-status-red-bg text-status-red border-status-red/30" },
    APPROVED: { label: "Aprobado", className: "bg-status-green-bg text-status-green border-status-green/30" },
    ARCHIVED: { label: "Archivado", className: "bg-muted text-muted-foreground" },
  };

  const projectStatus = project?.status || "DRAFT";
  const statusInfo = statusConfig[projectStatus] || statusConfig.DRAFT;
  const canSendToReview = !isReadOnly && (projectStatus === "DRAFT" || projectStatus === "WITH_OBSERVATIONS");
  const isReviewer = isConsultor || isDocente;
  const canApprove =
    isReviewer && (projectStatus === "IN_REVIEW" || projectStatus === "WITH_OBSERVATIONS");
  const approveBlocked = totalPendingComments > 0;
  const canExportPdf = projectStatus === "APPROVED";

  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: "DRAFT" | "IN_REVIEW" | "WITH_OBSERVATIONS" | "APPROVED" | "ARCHIVED") => {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast({ title: "Estado actualizado" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("approve_project", { _project_id: projectId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Proyecto aprobado" });
    },
    onError: (error: any) => {
      toast({ title: "No se pudo aprobar", description: error.message, variant: "destructive" });
    },
  });

  const saveStatusDisplay = {
    saved: { text: "Guardado ✓", className: "text-primary" },
    saving: { text: "Guardando...", className: "text-muted-foreground animate-pulse" },
    error: { text: "Error ⚠️", className: "text-destructive" },
    unsaved: { text: "Sin guardar", className: "text-muted-foreground" },
  };

  const renderFieldComments = (fieldKey: string) => {
    const fieldComments = commentsByField[fieldKey] || [];
    const hasComments = fieldComments.length > 0;
    const isActive = activeCommentField === fieldKey;

    if (!hasComments && !isActive) return null;

    return (
      <div className="absolute top-0 left-[calc(100%+1.5rem)] w-[260px] z-10">
        <CommentBubble
          comments={fieldComments}
          currentUserId={currentUserId}
          onAdd={(text) => addComment(fieldKey, text)}
          onReply={(parentId, text) => replyToComment(parentId, fieldKey, text)}
          onResolve={resolveComment}
          onDelete={deleteComment}
          canCreate={true}
          canReply={true}
          isActive={isActive}
          onActivate={() => handleFieldComment(fieldKey)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex h-[60px] items-center gap-3 border-b bg-card px-4 shadow-goblab-sm">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src={logoHerramientas} alt="Herramientas Algoritmos Éticos" className="h-7 w-auto object-contain" />
        </Link>

        <Input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          readOnly={isReadOnly}
          className="max-w-xs border-0 bg-transparent font-display text-lg h-9 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary"
          placeholder="Título del proyecto"
        />

        {/* Role badge */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isConsultor
            ? "bg-amber-bg text-amber border border-amber/30"
            : isDocente || isCommenter
              ? "bg-muted text-muted-foreground border border-border"
              : "bg-accent text-accent-foreground"
        }`}>
          {isDocente ? "Docente" : isConsultor ? "Consultor" : isCommenter ? "Comentarista" : "Formulador"}
        </span>

        {/* Project status + action */}
        <Badge variant="outline" className={statusInfo.className + " text-xs shrink-0"}>
          {statusInfo.label}
        </Badge>

        {canSendToReview && (
          <Button size="sm" variant="outline" onClick={() => changeStatusMutation.mutate("IN_REVIEW")} disabled={changeStatusMutation.isPending} className="text-xs shrink-0">
            <Send className="h-3.5 w-3.5 mr-1" /> Enviar a revisión
          </Button>
        )}

        {canApprove && (
          <Button
            size="sm"
            variant="default"
            onClick={() => approveMutation.mutate()}
            disabled={approveBlocked || approveMutation.isPending}
            title={approveBlocked ? "Resuelve todos los comentarios para poder aprobar" : "Aprobar proyecto"}
            className="text-xs shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
          </Button>
        )}

        <div className="flex-1" />

        {totalPendingComments > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber">
            <MessageSquare className="h-3.5 w-3.5" />
            {totalPendingComments} pendiente{totalPendingComments !== 1 ? "s" : ""}
          </span>
        )}

        <span className={`text-xs ${saveStatusDisplay[saveStatus].className}`}>
          {saveStatusDisplay[saveStatus].text}
        </span>

        {!isReadOnly && (
          <Button variant="outline" size="sm" onClick={flushSave} disabled={saveStatus === "saving"}>
            <Save className="h-3.5 w-3.5 mr-1" /> Guardar
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={!canExportPdf || isExporting}
          title={canExportPdf ? "Exportar PDF" : "Disponible cuando el proyecto esté aprobado"}
          className="text-xs"
        >
          <FileDown className="h-3.5 w-3.5 mr-1" />
          {isExporting ? "Generando..." : "Exportar PDF"}
        </Button>


        <Button
          variant={showHistorySidebar ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHistorySidebar(!showHistorySidebar)}
          className="text-xs"
        >
          <PanelRightOpen className="h-3.5 w-3.5 mr-1" />
          Historial
        </Button>

        {project?.join_code && (
          <TeamPanel projectId={projectId!} joinCode={(project as any).join_code} ownerId={project.created_by} />
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <EditorSidebar
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          responses={responses}
          commentCounts={commentCounts}
        />

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto bg-background"
          onClick={() => setActiveCommentField(null)}
        >
          <div className="py-10 px-8" style={{ paddingRight: 'max(2rem, calc(50% - 520px))' }}>
            {/* Document paper */}
            <div
              className="bg-card rounded-xl shadow-goblab-sm border border-border/50 px-10 py-8"
              style={{ maxWidth: '860px', overflow: 'visible' }}
            >
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Completa tu proyecto por etapas. Cada sección agrupa la información necesaria para avanzar en el proceso de formulación.
              </p>
              {FORM_SECTIONS.map((section, sIdx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={`scroll-mt-20 ${sIdx > 0 ? "mt-10 pt-8 border-t border-border/60" : ""}`}
                >
                  <div className="mb-6">
                    <h2 className="font-display text-xl text-foreground tracking-tight">
                      <span className="text-primary mr-2">{section.number}.</span>
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                        {section.description}
                      </p>
                    )}
                    {section.globalHint && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        💡 {section.globalHint}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    {section.fields.map((field, fIdx) => {
                      const prevGroup = fIdx > 0 ? (section.fields[fIdx - 1] as any).group : undefined;
                      const currGroup = (field as any).group;
                      const showGroupHeader = currGroup && currGroup !== prevGroup;
                      const isTable = "headers" in field || "rowLabels" in field || ("type" in field && (field as TableConfig).type !== undefined && ["dynamic-rows", "dynamic-cols", "activities"].includes((field as any).type));

                      if (isTable) {
                        const tableConfig = field as TableConfig;
                        return (
                          <div key={field.key} id={`field-${field.key}`} className="relative group space-y-2 py-3">
                            {showGroupHeader && (
                              <div className="mt-6 mb-2 rounded-md bg-accent/40 px-3 py-2 text-sm font-semibold text-foreground">{currGroup}</div>
                            )}
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm text-foreground">{tableConfig.label}</h3>
                              {canComment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFieldComment(field.key);
                                  }}
                                  className={`p-1 rounded transition-opacity ${
                                    commentCounts[field.key] ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  <MessageSquare
                                    className={`h-4 w-4 ${
                                      commentCounts[field.key] ? "text-amber fill-amber/20" : "text-muted-foreground"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                            {tableConfig.hint && (
                              <p className="text-xs text-muted-foreground">💡 {tableConfig.hint}</p>
                            )}
                            <DynamicTable
                              config={tableConfig}
                              data={responses[field.key]}
                              onChange={(data) => updateField(field.key, data)}
                              readOnly={isReadOnly}
                            />
                            {renderFieldComments(field.key)}
                          </div>
                        );
                      }

                      const formField = field as FormField;
                      return (
                        <div key={field.key} id={`field-${field.key}`} className="relative">
                          {showGroupHeader && (
                            <div className="mt-6 mb-2 rounded-md bg-accent/40 px-3 py-2 text-sm font-semibold text-foreground">{currGroup}</div>
                          )}
                          <QuestionBlock
                            field={formField}
                            value={
                              responses[field.key] !== undefined && responses[field.key] !== null
                                ? (responses[field.key] as any)
                                : formField.defaultValue || ""
                            }
                            onChange={(val) => updateField(field.key, val)}
                            readOnly={isReadOnly}
                            showCommentButton={canComment}
                            pendingComments={commentCounts[field.key] || 0}
                            onComment={() => handleFieldComment(field.key)}
                            isCommentActive={activeCommentField === field.key}
                          />
                          {renderFieldComments(field.key)}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Attribution Box */}
            <footer className="mt-10 mb-8 max-w-[860px] border border-border/60 rounded-lg bg-muted/40 px-6 py-5 text-[11px] text-muted-foreground/80 leading-relaxed space-y-3">
              <p>
                <strong>Esta ficha está bajo Licencia Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)</strong>, los términos y condiciones están disponibles{" "}
                <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer" className="underline text-primary/70 hover:text-primary">aquí</a>. Debes citar esta licencia al utilizarla.
              </p>
              <p>
                Esta ficha fue desarrollada originalmente por el <em>Center for Data Science and Public Policy</em> de la Universidad de Chicago. Para más información sobre nuestros programas y trabajo, por favor visita{" "}
                <a href="http://datasciencepublicpolicy.org" target="_blank" rel="noopener noreferrer" className="underline text-primary/70 hover:text-primary">datasciencepublicpolicy.org</a>{" "}
                o escríbenos a{" "}
                <a href="mailto:info@datascienceforsocialgood.org" className="underline text-primary/70 hover:text-primary">info@datascienceforsocialgood.org</a>
              </p>
              <p>
                Esta versión de la ficha ha sido actualizada a través de una colaboración entre el GobLab UAI, Carnegie Mellon University y el Instituto Tecnológico de Monterrey. Posteriormente se actualizó a partir de un trabajo con el Laboratorio de Gobierno de Chile y a través de una colaboración con CoDaTecs de la Universidad Nacional del Rosario.
              </p>
              <p>
                El GobLab UAI es el laboratorio de innovación de la Escuela de Gobierno de la Universidad Adolfo Ibáñez. Su misión es contribuir a la innovación en políticas públicas para beneficiar a la sociedad. Trabaja con organismos públicos, organizaciones de la sociedad civil e investigadores para lograr políticas públicas más eficaces, eficientes y equitativas mediante la ciencia de datos. Para obtener más información, visita{" "}
                <a href="https://goblab.uai.cl" target="_blank" rel="noopener noreferrer" className="underline text-primary/70 hover:text-primary">https://goblab.uai.cl</a>{" "}
                o envía un correo electrónico a{" "}
                <a href="mailto:goblab@uai.cl" className="underline text-primary/70 hover:text-primary">goblab@uai.cl</a>.
              </p>
              <p className="text-center font-semibold pt-1">Attribution ShareAlike (CC BY-SA)</p>
            </footer>
          </div>
        </main>

        {/* History Sidebar */}
        {showHistorySidebar && (
          <CommentHistorySidebar
            comments={comments}
            allComments={allComments}
            fieldHistory={fieldHistory}
            fieldLabels={fieldLabels}
            onReply={(parentId, fieldKey, text) => replyToComment(parentId, fieldKey, text)}
            onResolve={resolveComment}
            onDelete={deleteComment}
            onClose={() => setShowHistorySidebar(false)}
            onFieldClick={(fieldKey) => {
              const el = document.getElementById(`field-${fieldKey}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            canReply={!isConsultor}
          />
        )}
      </div>
    </div>
  );
}
