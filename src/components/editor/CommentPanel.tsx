import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2, Send } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  status: string;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
  parent_id: string | null;
}

interface CommentPanelProps {
  comments: Comment[];
  currentUserId: string;
  onAdd: (text: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  canCreate: boolean;
}

export function CommentPanel({ comments, currentUserId, onAdd, onResolve, onDelete, canCreate }: CommentPanelProps) {
  const [newComment, setNewComment] = useState("");
  const pending = comments.filter((c) => c.status === "PENDING");
  const resolved = comments.filter((c) => c.status === "RESOLVED");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAdd(newComment.trim());
    setNewComment("");
  };

  return (
    <div className="border rounded-md bg-card mt-2 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-amber-bg/50">
        <span className="text-xs font-semibold text-amber">🟡 Comentarios</span>
        {pending.length > 0 && (
          <span className="text-xs text-amber font-medium">[{pending.length} pendientes]</span>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto divide-y">
        {comments.map((c) => (
          <div key={c.id} className={`px-3 py-2.5 space-y-1 ${c.status === "RESOLVED" ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  C
                </span>
                <span className="text-xs font-medium text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex gap-1">
                {c.status === "PENDING" && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-status-green" onClick={() => onResolve(c.id)}>
                    <Check className="h-3 w-3 mr-0.5" /> Resolver
                  </Button>
                )}
                {c.author_id === currentUserId && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => onDelete(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-foreground pl-7">{c.text}</p>
            {c.status === "RESOLVED" && c.resolved_by_name && (
              <p className="text-[10px] text-muted-foreground pl-7">
                Resuelto por {c.resolved_by_name} {c.resolved_at && `el ${new Date(c.resolved_at).toLocaleDateString("es-CL")}`}
              </p>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-4 text-center">No hay comentarios aún.</p>
        )}
      </div>

      {canCreate && (
        <div className="p-3 border-t flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="min-h-[60px] text-xs resize-none"
          />
          <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()} className="self-end">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
