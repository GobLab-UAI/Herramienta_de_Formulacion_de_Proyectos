import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GobLabLogo } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { QuestionBlock } from "@/components/editor/QuestionBlock";
import { DynamicTable } from "@/components/editor/DynamicTable";
import { CommentsSidebar } from "@/components/editor/CommentsSidebar";
import { FORM_SECTIONS, REQUIRED_FIELDS, type FormField, type TableConfig } from "@/lib/formSections";
import { Save, ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

type SaveStatus = "saved" | "saving" | "error" | "unsaved";

export default function ProjectEditor({ reviewMode = false }: { reviewMode?: boolean }) {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState(FORM_SECTIONS[0].id);
  const [role, setRole] = useState<"FORMULADOR" | "CONSULTOR">(reviewMode ? "CONSULTOR" : "FORMULADOR");
  const [title, setTitle] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showComments, setShowComments] = useState(false);
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const pendingChanges = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isReadOnly = role === "CONSULTOR";
  const isConsultor = role === "CONSULTOR";

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

  // Fetch member role
  const { data: membership } = useQuery({
    queryKey: ["membership", projectId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_members")
        .select("role, is_owner")
        .eq("project_id", projectId!)
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!projectId && !!user,
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

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, field_key, author_id, text, status, resolved_by, resolved_at, created_at, parent_id, deleted_at")
        .eq("project_id", projectId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (!data?.length) return [];
      const authorIds = [...new Set(data.map((c) => c.author_id))];
      const resolverIds = [...new Set(data.filter((c) => c.resolved_by).map((c) => c.resolved_by!))];
      const allIds = [...new Set([...authorIds, ...resolverIds])];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", allIds);
      const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || "Usuario"]));

      return data.map((c) => ({
        ...c,
        author_name: nameMap[c.author_id] || "Usuario",
        resolved_by_name: c.resolved_by ? nameMap[c.resolved_by] : undefined,
      }));
    },
    enabled: !!projectId,
  });

  // Initialize state
  useEffect(() => {
    if (project) setTitle(project.title);
  }, [project]);

  useEffect(() => {
    if (formResponses) {
      const resp: Record<string, any> = {};
      formResponses.forEach((r) => {
        resp[r.field_key] = r.table_data || r.field_value || "";
      });
      setResponses(resp);
    }
  }, [formResponses]);

  useEffect(() => {
    if (membership) {
      setRole(reviewMode ? "CONSULTOR" : (membership.role as any));
    }
  }, [membership, reviewMode]);

  // Comment counts
  const commentCounts: Record<string, number> = {};
  comments.forEach((c: any) => {
    if (c.status === "PENDING") {
      commentCounts[c.field_key] = (commentCounts[c.field_key] || 0) + 1;
    }
  });

  const totalPendingComments = Object.values(commentCounts).reduce((a, b) => a + b, 0);

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      const keys = Array.from(pendingChanges.current);
      if (keys.length === 0) return;
      setSaveStatus("saving");
      const upserts = keys.map((key) => {
        const value = responses[key];
        const isTable = typeof value === "object" && value !== null;
        return {
          project_id: projectId!,
          field_key: key,
          field_value: isTable ? null : (value as string) || null,
          table_data: isTable ? value : null,
          updated_by: user!.id,
        };
      });
      for (const upsert of upserts) {
        const { error } = await supabase
          .from("form_responses")
          .upsert(upsert, { onConflict: "project_id,field_key" });
        if (error) throw error;
      }
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
    onSuccess: () => setSaveStatus("saved"),
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
  };

  // Comments
  const addComment = async (fieldKey: string, text: string) => {
    await supabase.from("comments").insert({ project_id: projectId!, field_key: fieldKey, author_id: user!.id, text });
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const resolveComment = async (commentId: string) => {
    await supabase.from("comments").update({ status: "RESOLVED" as any, resolved_by: user!.id, resolved_at: new Date().toISOString() }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").update({ deleted_at: new Date().toISOString() }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const updateTitle = async (newTitle: string) => {
    setTitle(newTitle);
    await supabase.from("projects").update({ title: newTitle }).eq("id", projectId!);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFieldComment = (fieldKey: string) => {
    setActiveCommentField(fieldKey);
    setShowComments(true);
  };

  const handleCommentFieldClick = (fieldKey: string) => {
    setActiveCommentField(fieldKey);
    // Scroll to the field in the editor
    const el = document.getElementById(`field-${fieldKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const saveStatusDisplay = {
    saved: { text: "Guardado ✓", className: "text-primary" },
    saving: { text: "Guardando...", className: "text-muted-foreground animate-pulse" },
    error: { text: "Error ⚠️", className: "text-destructive" },
    unsaved: { text: "Sin guardar", className: "text-muted-foreground" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex h-[60px] items-center gap-3 border-b bg-card px-4 shadow-goblab-sm">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <GobLabLogo size={28} />
        </Link>

        <Input
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          readOnly={isReadOnly}
          className="max-w-xs border-0 bg-transparent font-display text-lg h-9 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary"
          placeholder="Título del proyecto"
        />

        <div className="flex items-center gap-1 ml-2 bg-muted rounded-md p-0.5">
          <Button
            variant={role === "FORMULADOR" ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setRole("FORMULADOR")}
          >
            Formulador
          </Button>
          <Button
            variant={role === "CONSULTOR" ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setRole("CONSULTOR")}
          >
            Consultor
          </Button>
        </div>

        <div className="flex-1" />

        <span className={`text-xs ${saveStatusDisplay[saveStatus].className}`}>
          {saveStatusDisplay[saveStatus].text}
        </span>

        <Button variant="outline" size="sm" onClick={flushSave} disabled={saveStatus === "saving"}>
          <Save className="h-3.5 w-3.5 mr-1" /> Guardar
        </Button>

        {/* Comments toggle */}
        <Button
          variant={showComments ? "default" : "outline"}
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="relative"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          Comentarios
          {totalPendingComments > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber text-[9px] font-bold text-primary-foreground px-0.5">
              {totalPendingComments}
            </span>
          )}
        </Button>

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

        {/* Main content - document style */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-[820px] px-8 py-10">
            {/* Document paper */}
            <div className="bg-card rounded-xl shadow-goblab-sm border border-border/50 px-10 py-8">
              {FORM_SECTIONS.map((section, sIdx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={`scroll-mt-20 ${sIdx > 0 ? "mt-10 pt-8 border-t border-border/60" : ""}`}
                >
                  <div className="mb-6">
                    <h2 className="font-display text-xl text-foreground tracking-tight">
                      {section.number !== "P" && (
                        <span className="text-primary mr-2">{section.number}.</span>
                      )}
                      {section.title}
                    </h2>
                    {section.globalHint && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        💡 {section.globalHint}
                      </p>
                    )}
                  </div>

                  <div className={section.id === "seccion-10" ? "grid gap-4 md:grid-cols-2" : "space-y-1"}>
                    {section.fields.map((field) => {
                      const isTable = "headers" in field || "rowLabels" in field || ("type" in field && (field as TableConfig).type !== undefined && ["dynamic-rows", "dynamic-cols", "activities"].includes((field as any).type));

                      if (isTable) {
                        const tableConfig = field as TableConfig;
                        return (
                          <div key={field.key} id={`field-${field.key}`} className="space-y-2 py-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm text-foreground">{tableConfig.label}</h3>
                              {isConsultor && (
                                <button
                                  onClick={() => handleFieldComment(field.key)}
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
                          </div>
                        );
                      }

                      const formField = field as FormField;
                      return (
                        <div key={field.key} id={`field-${field.key}`}>
                          <QuestionBlock
                            field={formField}
                            value={(responses[field.key] as string) || formField.defaultValue || ""}
                            onChange={(val) => updateField(field.key, val)}
                            readOnly={isReadOnly}
                            showCommentButton={isConsultor}
                            pendingComments={commentCounts[field.key] || 0}
                            onComment={() => handleFieldComment(field.key)}
                            isCommentActive={activeCommentField === field.key}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-8 pb-8 text-[11px] text-muted-foreground text-center leading-relaxed">
              Esta ficha fue desarrollada originalmente por el Center for Data Science and Public Policy de la Universidad de Chicago y el GobLab UAI, en colaboración con CMU, ITAM y CoDaTecs/Universidad Nacional del Rosario. Licencia CC BY-SA 3.0 · goblab.uai.cl
            </footer>
          </div>
        </main>

        {/* Right Comments Sidebar */}
        {showComments && (
          <CommentsSidebar
            comments={comments as any}
            currentUserId={user!.id}
            activeFieldKey={activeCommentField}
            fieldLabels={fieldLabels}
            onAdd={addComment}
            onResolve={resolveComment}
            onDelete={deleteComment}
            onClose={() => { setShowComments(false); setActiveCommentField(null); }}
            onFieldClick={handleCommentFieldClick}
            canCreate={isConsultor}
          />
        )}
      </div>
    </div>
  );
}
