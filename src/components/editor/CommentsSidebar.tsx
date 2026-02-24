import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2, Send, X, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  field_key: string;
  author_id: string;
  author_name: string;
  status: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
  parent_id: string | null;
}

interface CommentsSidebarProps {
  comments: Comment[];
  currentUserId: string;
  activeFieldKey: string | null;
  fieldLabels: Record<string, string>;
  onAdd: (fieldKey: string, text: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onClose: () => void;
  onFieldClick: (fieldKey: string) => void;
  canCreate: boolean;
}

export function CommentsSidebar({
  comments,
  currentUserId,
  activeFieldKey,
  fieldLabels,
  onAdd,
  onResolve,
  onDelete,
  onClose,
  onFieldClick,
  canCreate,
}: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(activeFieldKey);

  // Group comments by field_key
  const grouped: Record<string, Comment[]> = {};
  comments.forEach((c) => {
    if (!grouped[c.field_key]) grouped[c.field_key] = [];
    grouped[c.field_key].push(c);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const aFirst = grouped[a][0]?.created_at || "";
    const bFirst = grouped[b][0]?.created_at || "";
    return aFirst.localeCompare(bFirst);
  });

  // If activeFieldKey is set, show it first
  if (activeFieldKey && !sortedKeys.includes(activeFieldKey)) {
    sortedKeys.unshift(activeFieldKey);
  } else if (activeFieldKey) {
    const idx = sortedKeys.indexOf(activeFieldKey);
    if (idx > 0) {
      sortedKeys.splice(idx, 1);
      sortedKeys.unshift(activeFieldKey);
    }
  }

  const handleSubmit = (fieldKey: string) => {
    if (!newComment.trim()) return;
    onAdd(fieldKey, newComment.trim());
    setNewComment("");
    setReplyingTo(null);
  };

  const pendingCount = comments.filter((c) => c.status === "PENDING").length;

  return (
    <aside className="w-[320px] shrink-0 border-l bg-card h-[calc(100vh-60px)] sticky top-[60px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Comentarios</span>
          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-primary-foreground px-1.5">
              {pendingCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comment threads */}
      <div className="flex-1 overflow-y-auto">
        {sortedKeys.length === 0 && !activeFieldKey && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No hay comentarios aún.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Haz clic en el ícono de comentario junto a cualquier campo para agregar uno.
            </p>
          </div>
        )}

        {sortedKeys.map((fieldKey) => {
          const fieldComments = grouped[fieldKey] || [];
          const isActive = fieldKey === activeFieldKey;
          const label = fieldLabels[fieldKey] || fieldKey;

          return (
            <div
              key={fieldKey}
              className={`border-b transition-colors ${isActive ? "bg-accent/30" : "hover:bg-muted/30"}`}
            >
              {/* Field label */}
              <button
                onClick={() => onFieldClick(fieldKey)}
                className="w-full text-left px-4 pt-3 pb-1"
              >
                <span className="text-xs font-semibold text-primary truncate block">
                  {label}
                </span>
              </button>

              {/* Comments */}
              <div className="px-4 pb-3 space-y-2.5">
                {fieldComments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg p-2.5 text-xs ${
                      c.status === "RESOLVED"
                        ? "bg-muted/40 opacity-60"
                        : "bg-background border border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                          {c.author_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-foreground">{c.author_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-foreground pl-[26px] leading-relaxed">{c.text}</p>
                    {c.status === "RESOLVED" && c.resolved_by_name && (
                      <p className="text-[10px] text-muted-foreground pl-[26px] mt-1">
                        ✓ Resuelto por {c.resolved_by_name}
                      </p>
                    )}
                    {c.status === "PENDING" && (
                      <div className="flex gap-1 pl-[26px] mt-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-green-600 hover:text-green-700 px-1.5"
                          onClick={() => onResolve(c.id)}
                        >
                          <Check className="h-3 w-3 mr-0.5" /> Resolver
                        </Button>
                        {c.author_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-destructive px-1.5"
                            onClick={() => onDelete(c.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Reply box for active field */}
                {canCreate && isActive && (
                  <div className="flex gap-1.5 mt-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="min-h-[48px] text-xs resize-none flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          handleSubmit(fieldKey);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(fieldKey)}
                      disabled={!newComment.trim()}
                      className="self-end h-8 w-8 p-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
