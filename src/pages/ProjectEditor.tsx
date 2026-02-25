import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { GobLabLogo } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { QuestionBlock } from "@/components/editor/QuestionBlock";
import { DynamicTable } from "@/components/editor/DynamicTable";
import { CommentBubble } from "@/components/editor/CommentBubble";
import { FORM_SECTIONS, REQUIRED_FIELDS, type FormField, type TableConfig } from "@/lib/formSections";
import { Save, ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

type SaveStatus = "saved" | "saving" | "error" | "unsaved";

const ANON_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function ProjectEditor({ reviewMode = false }: { reviewMode?: boolean }) {
  const { id: projectId } = useParams<{ id: string }>();
  const { isConsultor: roleIsConsultor } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isConsultor = reviewMode || roleIsConsultor;
  const isReadOnly = isConsultor;

  const [activeSection, setActiveSection] = useState(FORM_SECTIONS[0].id);
  const [title, setTitle] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const pendingChanges = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      return (data || []).map((c) => ({
        ...c,
        author_name: "Usuario",
        resolved_by_name: c.resolved_by ? "Usuario" : undefined,
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

  // Comment counts
  const commentCounts: Record<string, number> = {};
  comments.forEach((c: any) => {
    if (c.status === "PENDING") {
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
      const upserts = keys.map((key) => {
        const value = responses[key];
        const isTable = typeof value === "object" && value !== null;
        return {
          project_id: projectId!,
          field_key: key,
          field_value: isTable ? null : (value as string) || null,
          table_data: isTable ? value : null,
          updated_by: ANON_USER_ID,
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
    await supabase.from("comments").insert({ project_id: projectId!, field_key: fieldKey, author_id: ANON_USER_ID, text });
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const resolveComment = async (commentId: string) => {
    await supabase.from("comments").update({ status: "RESOLVED" as any, resolved_by: ANON_USER_ID, resolved_at: new Date().toISOString() }).eq("id", commentId);
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
    setActiveCommentField(activeCommentField === fieldKey ? null : fieldKey);
  };

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
          currentUserId={ANON_USER_ID}
          onAdd={(text) => addComment(fieldKey, text)}
          onResolve={resolveComment}
          onDelete={deleteComment}
          canCreate={isConsultor}
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
          <GobLabLogo size={28} />
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
            : "bg-accent text-accent-foreground"
        }`}>
          {isConsultor ? "Consultor" : "Formulador"}
        </span>

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
              style={{ maxWidth: '680px', overflow: 'visible' }}
            >
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
                          <div key={field.key} id={`field-${field.key}`} className="relative group space-y-2 py-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-sm text-foreground">{tableConfig.label}</h3>
                              {isConsultor && (
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
                          {renderFieldComments(field.key)}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer */}
            <footer className="mt-8 pb-8 text-[11px] text-muted-foreground text-center leading-relaxed max-w-[680px]">
              Esta ficha fue desarrollada originalmente por el Center for Data Science and Public Policy de la Universidad de Chicago y el GobLab UAI, en colaboración con CMU, ITAM y CoDaTecs/Universidad Nacional del Rosario. Licencia CC BY-SA 3.0 · goblab.uai.cl
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
