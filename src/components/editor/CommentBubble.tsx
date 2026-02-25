import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2, Send, ChevronDown, ChevronUp, Reply } from "lucide-react";

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
  replies?: Comment[];
}

interface CommentBubbleProps {
  comments: Comment[];
  currentUserId: string;
  onAdd: (text: string) => void;
  onReply: (parentId: string, text: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  canCreate: boolean;
  canReply: boolean;
  isActive: boolean;
  onActivate: () => void;
}

export function CommentBubble({
  comments,
  currentUserId,
  onAdd,
  onReply,
  onResolve,
  onDelete,
  canCreate,
  canReply,
  isActive,
  onActivate,
}: CommentBubbleProps) {
  const [newText, setNewText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // Separate top-level comments from replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap: Record<string, Comment[]> = {};
  comments.filter((c) => c.parent_id).forEach((c) => {
    if (!repliesMap[c.parent_id!]) repliesMap[c.parent_id!] = [];
    repliesMap[c.parent_id!].push(c);
  });

  const pending = topLevel.filter((c) => c.status === "PENDING");
  const resolved = topLevel.filter((c) => c.status === "RESOLVED");

  const handleSubmit = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText("");
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyText.trim()) return;
    onReply(parentId, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
  };

  const renderReplies = (parentId: string) => {
    const replies = repliesMap[parentId] || [];
    if (replies.length === 0 && replyingTo !== parentId) return null;

    return (
      <div className="pl-6 mt-1.5 space-y-1.5 border-l-2 border-primary/10">
        {replies.map((r) => (
          <div key={r.id} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold shrink-0">
                {r.author_name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-foreground text-[11px]">{r.author_name}</span>
              <span className="text-muted-foreground text-[9px]">
                {new Date(r.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed pl-[26px] text-[11px]">{r.text}</p>
          </div>
        ))}
        {replyingTo === parentId && (
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribe una respuesta..."
              className="min-h-[36px] text-xs resize-none border-muted"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReplySubmit(parentId);
              }}
            />
            <div className="flex justify-end gap-1 mt-1">
              <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setReplyingTo(null)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => handleReplySubmit(parentId)} disabled={!replyText.trim()} className="h-5 text-[10px] px-2">
                <Send className="h-2.5 w-2.5 mr-0.5" /> Responder
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-lg border bg-card shadow-goblab-sm transition-all cursor-pointer ${
        isActive ? "ring-2 ring-primary/30 border-primary/40" : "border-border"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      {/* Connector arrow */}
      <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-border" />
      <div className="absolute left-[-6px] top-4 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-card" style={{ marginTop: '1px' }} />

      <div className="p-3 space-y-2.5">
        {/* Pending comments */}
        {pending.map((c) => (
          <div key={c.id} className="text-xs space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                {c.author_name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground block truncate">{c.author_name}</span>
              </div>
              <span className="text-muted-foreground text-[10px] shrink-0">
                {new Date(c.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed pl-8">{c.text}</p>

            {/* Replies */}
            {renderReplies(c.id)}

            <div className="flex gap-1 pl-8">
              {canReply && replyingTo !== c.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyingTo(c.id);
                  }}
                >
                  <Reply className="h-3 w-3 mr-0.5" /> Responder
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] px-1.5 hover:bg-accent"
                style={{ color: "hsl(var(--green))" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(c.id);
                }}
              >
                <Check className="h-3 w-3 mr-0.5" /> Resolver
              </Button>
              {c.author_id === currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-1.5 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Resolved toggle */}
        {resolved.length > 0 && (
          <div className="border-t border-border pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResolved(!showResolved);
              }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showResolved ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {resolved.length} resuelto{resolved.length !== 1 ? "s" : ""}
            </button>
            {showResolved && (
              <div className="mt-2 space-y-2">
                {resolved.map((c) => (
                  <div key={c.id} className="text-xs opacity-60 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold">
                        {c.author_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-muted-foreground">{c.author_name}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-[26px] line-through">{c.text}</p>
                    {renderReplies(c.id)}
                    {c.resolved_by_name && (
                      <p className="text-[10px] text-muted-foreground pl-[26px]">✓ Resuelto por {c.resolved_by_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New comment input */}
        {canCreate && isActive && (
          <div className="border-t border-border pt-2" onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="min-h-[40px] text-xs resize-none border-muted"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
              }}
            />
            <div className="flex justify-end mt-1.5">
              <Button size="sm" onClick={handleSubmit} disabled={!newText.trim()} className="h-6 text-xs px-3">
                <Send className="h-3 w-3 mr-1" /> Comentar
              </Button>
            </div>
          </div>
        )}

        {canCreate && !isActive && pending.length === 0 && resolved.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-1">Haz clic para comentar</p>
        )}
      </div>
    </div>
  );
}
