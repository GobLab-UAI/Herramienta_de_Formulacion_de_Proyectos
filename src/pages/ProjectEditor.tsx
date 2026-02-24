import { useState, useEffect, useCallback, useRef } from "react";
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
import { CommentPanel } from "@/components/editor/CommentPanel";
import { FORM_SECTIONS, REQUIRED_FIELDS, type FormField, type TableConfig } from "@/lib/formSections";
import { Save, ArrowLeft } from "lucide-react";
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
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const pendingChanges = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isReadOnly = role === "CONSULTOR";
  const isConsultor = role === "CONSULTOR";

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

      // Enrich with author names
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

  // Initialize state from fetched data
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
      if (reviewMode) {
        setRole("CONSULTOR");
      } else {
        setRole(membership.role as any);
      }
    }
  }, [membership, reviewMode]);

  // Comment counts per field
  const commentCounts: Record<string, number> = {};
  comments.forEach((c: any) => {
    if (c.status === "PENDING") {
      commentCounts[c.field_key] = (commentCounts[c.field_key] || 0) + 1;
    }
  });

  // Save function
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

      // Update completion
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
    if (pendingChanges.current.size > 0) {
      saveMutation.mutate();
    }
  }, [saveMutation]);

  // Auto-save every 30s
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      flushSave();
    }, 30000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [flushSave]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        flushSave();
      }
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
    await supabase.from("comments").insert({
      project_id: projectId!,
      field_key: fieldKey,
      author_id: user!.id,
      text,
    });
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const resolveComment = async (commentId: string) => {
    await supabase.from("comments").update({
      status: "RESOLVED" as any,
      resolved_by: user!.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").update({
      deleted_at: new Date().toISOString(),
    }).eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", projectId] });
  };

  // Title update
  const updateTitle = async (newTitle: string) => {
    setTitle(newTitle);
    await supabase.from("projects").update({ title: newTitle }).eq("id", projectId!);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveStatusDisplay = {
    saved: { text: "Guardado ✓", className: "text-primary" },
    saving: { text: "Guardando...", className: "text-muted-foreground animate-pulse" },
    error: { text: "Error al guardar ⚠️", className: "text-destructive" },
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

        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <EditorSidebar
          activeSection={activeSection}
          onSectionClick={scrollToSection}
          responses={responses}
          commentCounts={commentCounts}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[920px] px-6 py-8 space-y-12">
            {FORM_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="font-display text-2xl text-foreground border-b-2 border-primary pb-2">
                    {section.number !== "P" && `${section.number}. `}{section.title}
                  </h2>
                  {section.globalHint && (
                    <div className="mt-3 rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">
                      💡 {section.globalHint}
                    </div>
                  )}
                </div>

                <div className={section.id === "seccion-10" ? "grid gap-6 md:grid-cols-2" : "space-y-6"}>
                  {section.fields.map((field) => {
                    const isTable = "headers" in field || "rowLabels" in field || "type" in field && (field as TableConfig).type !== undefined && ["dynamic-rows", "dynamic-cols", "activities"].includes((field as any).type);

                    if (isTable) {
                      const tableConfig = field as TableConfig;
                      return (
                        <div key={field.key} className="space-y-2">
                          <h3 className="font-semibold text-sm text-foreground">{tableConfig.label}</h3>
                          {tableConfig.hint && (
                            <p className="text-xs text-muted-foreground bg-accent/50 rounded-md px-3 py-2">
                              💡 {tableConfig.hint}
                            </p>
                          )}
                          <DynamicTable
                            config={tableConfig}
                            data={responses[field.key]}
                            onChange={(data) => updateField(field.key, data)}
                            readOnly={isReadOnly}
                          />
                          {isConsultor && (
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={commentCounts[field.key] ? "text-amber" : "text-muted-foreground"}
                                onClick={() => setOpenComments((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                              >
                                💬 {commentCounts[field.key] || "Comentar"}
                              </Button>
                              {openComments[field.key] && (
                                <CommentPanel
                                  comments={comments.filter((c: any) => c.field_key === field.key)}
                                  currentUserId={user!.id}
                                  onAdd={(text) => addComment(field.key, text)}
                                  onResolve={resolveComment}
                                  onDelete={deleteComment}
                                  canCreate={isConsultor}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const formField = field as FormField;
                    return (
                      <div key={field.key}>
                        <QuestionBlock
                          field={formField}
                          value={(responses[field.key] as string) || formField.defaultValue || ""}
                          onChange={(val) => updateField(field.key, val)}
                          readOnly={isReadOnly}
                          showCommentButton={isConsultor}
                          pendingComments={commentCounts[field.key] || 0}
                          onComment={() => setOpenComments((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                        />
                        {openComments[field.key] && (
                          <CommentPanel
                            comments={comments.filter((c: any) => c.field_key === field.key)}
                            currentUserId={user!.id}
                            onAdd={(text) => addComment(field.key, text)}
                            onResolve={resolveComment}
                            onDelete={deleteComment}
                            canCreate={isConsultor}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Footer */}
            <footer className="border-t pt-6 pb-8 text-xs text-muted-foreground text-center">
              Esta ficha fue desarrollada originalmente por el Center for Data Science and Public Policy de la Universidad de Chicago y el GobLab UAI, en colaboración con CMU, ITAM y CoDaTecs/Universidad Nacional del Rosario. Licencia CC BY-SA 3.0 · goblab.uai.cl
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
