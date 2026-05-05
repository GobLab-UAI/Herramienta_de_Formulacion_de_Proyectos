import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2, Send, X, MessageSquare, Reply, History } from "lucide-react";

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
  deleted_at?: string | null;
}

interface CommentHistorySidebarProps {
  comments: Comment[];
  allComments: Comment[]; // includes resolved and deleted
  fieldHistory?: FieldHistoryEntry[];
  fieldLabels: Record<string, string>;
  onReply: (parentId: string, fieldKey: string, text: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onClose: () => void;
  onFieldClick: (fieldKey: string) => void;
  canReply: boolean;
}

interface FieldHistoryEntry {
  id: string;
  field_key: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  author_name: string;
}

export function CommentHistorySidebar({
  comments,
  allComments,
  fieldHistory = [],
  fieldLabels,
  onReply,
  onResolve,
  onDelete,
  onClose,
  onFieldClick,
  canReply,
}: CommentHistorySidebarProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showSection, setShowSection] = useState<"pending" | "resolved" | "deleted" | "changes">("pending");

  // Build replies map from ALL comments (including deleted/resolved threads)
  const repliesMap: Record<string, Comment[]> = {};
  allComments.filter((c) => c.parent_id && !c.deleted_at).forEach((c) => {
    if (!repliesMap[c.parent_id!]) repliesMap[c.parent_id!] = [];
    repliesMap[c.parent_id!].push(c);
  });

  // Top-level comments only
  const topLevel = allComments.filter((c) => !c.parent_id);
  const pending = topLevel.filter((c) => c.status === "PENDING" && !c.deleted_at);
  const resolved = topLevel.filter((c) => c.status === "RESOLVED" && !c.deleted_at);
  const deleted = topLevel.filter((c) => c.deleted_at);

  // Group by field
  const groupByField = (items: Comment[]) => {
    const grouped: Record<string, Comment[]> = {};
    items.forEach((c) => {
      if (!grouped[c.field_key]) grouped[c.field_key] = [];
      grouped[c.field_key].push(c);
    });
    return grouped;
  };

  const currentItems = showSection === "pending" ? pending : showSection === "resolved" ? resolved : deleted;
  const grouped = groupByField(currentItems);

  const handleReplySubmit = (parentId: string, fieldKey: string) => {
    if (!replyText.trim()) return;
    onReply(parentId, fieldKey, replyText.trim());
    setReplyText("");
    setReplyingTo(null);
  };

  const renderReplies = (parentId: string) => {
    const replies = repliesMap[parentId] || [];
    if (replies.length === 0) return null;
    return (
      <div className="pl-5 mt-1.5 space-y-1.5 border-l-2 border-primary/10">
        {replies.map((r) => (
          <div key={r.id} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[8px] font-bold">
                {r.author_name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium text-foreground text-[11px]">{r.author_name}</span>
              <span className="text-muted-foreground text-[9px]">
                {new Date(r.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed pl-[22px] text-[11px]">{r.text}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <aside className="w-[340px] shrink-0 border-l bg-card h-[calc(100vh-60px)] sticky top-[60px] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Historial de Comentarios</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setShowSection("pending")}
          className={`flex-1 text-[11px] py-2.5 font-medium transition-colors border-b-2 ${
            showSection === "pending" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pend. ({pending.length})
        </button>
        <button
          onClick={() => setShowSection("resolved")}
          className={`flex-1 text-[11px] py-2.5 font-medium transition-colors border-b-2 ${
            showSection === "resolved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Resueltos ({resolved.length})
        </button>
        <button
          onClick={() => setShowSection("deleted")}
          className={`flex-1 text-[11px] py-2.5 font-medium transition-colors border-b-2 ${
            showSection === "deleted" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Elim. ({deleted.length})
        </button>
        <button
          onClick={() => setShowSection("changes")}
          className={`flex-1 text-[11px] py-2.5 font-medium transition-colors border-b-2 inline-flex items-center justify-center gap-1 ${
            showSection === "changes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-3 w-3" /> Cambios ({fieldHistory.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showSection === "changes" ? (
          <ChangesView entries={fieldHistory} fieldLabels={fieldLabels} onFieldClick={onFieldClick} />
        ) : (
        <>
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              {showSection === "pending" ? "No hay comentarios pendientes." :
               showSection === "resolved" ? "No hay comentarios resueltos." :
               "No hay comentarios eliminados."}
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([fieldKey, fieldComments]) => {
          const label = fieldLabels[fieldKey] || fieldKey;

          return (
            <div key={fieldKey} className="border-b">
              {/* Field label */}
              <button
                onClick={() => onFieldClick(fieldKey)}
                className="w-full text-left px-4 pt-3 pb-1 hover:bg-muted/30 transition-colors"
              >
                <span className="text-[11px] font-semibold text-primary truncate block">{label}</span>
              </button>

              {/* Comments */}
              <div className="px-4 pb-3 space-y-2">
                {fieldComments.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-lg p-2.5 text-xs ${
                      c.deleted_at
                        ? "bg-destructive/5 border border-destructive/20 opacity-70"
                        : c.status === "RESOLVED"
                        ? "bg-muted/40 opacity-70"
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
                        {new Date(c.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-foreground pl-[26px] leading-relaxed ${c.deleted_at ? "line-through" : c.status === "RESOLVED" ? "line-through" : ""}`}>
                      {c.text}
                    </p>

                    {/* Replies */}
                    {renderReplies(c.id)}

                    {/* Reply input */}
                    {replyingTo === c.id && (
                      <div className="pl-[26px] mt-2" onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escribe una respuesta..."
                          className="min-h-[36px] text-xs resize-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReplySubmit(c.id, fieldKey);
                          }}
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setReplyingTo(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={() => handleReplySubmit(c.id, fieldKey)} disabled={!replyText.trim()} className="h-5 text-[10px] px-2">
                            <Send className="h-2.5 w-2.5 mr-0.5" /> Enviar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {c.status === "RESOLVED" && c.resolved_by_name && !c.deleted_at && (
                      <p className="text-[10px] text-muted-foreground pl-[26px] mt-1">
                        ✓ Resuelto por {c.resolved_by_name}
                        {c.resolved_at && ` el ${new Date(c.resolved_at).toLocaleDateString("es-CL")}`}
                      </p>
                    )}
                    {c.deleted_at && (
                      <p className="text-[10px] text-destructive/70 pl-[26px] mt-1">
                        🗑 Eliminado el {new Date(c.deleted_at).toLocaleDateString("es-CL")}
                      </p>
                    )}
                    {c.status === "PENDING" && !c.deleted_at && (
                      <div className="flex gap-1 pl-[26px] mt-1.5">
                        {canReply && replyingTo !== c.id && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => setReplyingTo(c.id)}
                          >
                            <Reply className="h-3 w-3 mr-0.5" /> Responder
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 text-[10px] px-1.5 hover:bg-accent"
                          style={{ color: "hsl(var(--green))" }}
                          onClick={() => onResolve(c.id)}
                        >
                          <Check className="h-3 w-3 mr-0.5" /> Resolver
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 text-[10px] text-destructive px-1.5"
                          onClick={() => onDelete(c.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </>
        )}
      </div>
    </aside>
  );
}

function truncate(str: string | null, n = 80) {
  if (!str) return "—";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

type TableLike = { headers?: string[]; rows?: any[][] } | null;

function parseTable(str: string | null): TableLike {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj && Array.isArray(obj.rows)) return obj as TableLike;
    return null;
  } catch {
    return null;
  }
}

function rowKey(row: any[]) {
  return JSON.stringify(row);
}

function diffTables(oldT: TableLike, newT: TableLike) {
  const headers = newT?.headers || oldT?.headers || [];
  const oldRows = oldT?.rows || [];
  const newRows = newT?.rows || [];
  const oldSet = new Set(oldRows.map(rowKey));
  const newSet = new Set(newRows.map(rowKey));
  const added = newRows.filter((r) => !oldSet.has(rowKey(r)));
  const removed = oldRows.filter((r) => !newSet.has(rowKey(r)));
  return { headers, added, removed, oldCount: oldRows.length, newCount: newRows.length };
}

function MiniRow({ headers, row, tone }: { headers: string[]; row: any[]; tone: "add" | "remove" }) {
  const colors =
    tone === "add"
      ? "border-primary/30 bg-primary/5"
      : "border-destructive/30 bg-destructive/5";
  return (
    <div className={`rounded border ${colors} px-2 py-1.5 text-[10.5px] space-y-0.5`}>
      {headers.map((h, i) => {
        const v = row[i];
        if (v == null || v === "") return null;
        return (
          <div key={i} className="flex gap-1.5">
            <span className="text-muted-foreground font-medium shrink-0 min-w-[60px]">{h || `Col ${i + 1}`}:</span>
            <span className="text-foreground break-words">{String(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TableDiff({ oldVal, newVal }: { oldVal: string | null; newVal: string | null }) {
  const oldT = parseTable(oldVal);
  const newT = parseTable(newVal);
  const { headers, added, removed, oldCount, newCount } = diffTables(oldT, newT);

  return (
    <div className="space-y-1.5 text-[11px]">
      <div className="text-[10px] text-muted-foreground">
        Tabla actualizada · {oldCount} → {newCount} fila{newCount !== 1 ? "s" : ""}
      </div>
      {removed.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wide text-destructive/70 font-semibold">
            Eliminadas ({removed.length})
          </span>
          {removed.slice(0, 5).map((r, i) => (
            <MiniRow key={i} headers={headers} row={r} tone="remove" />
          ))}
          {removed.length > 5 && (
            <p className="text-[10px] text-muted-foreground">+{removed.length - 5} más…</p>
          )}
        </div>
      )}
      {added.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-wide text-primary/70 font-semibold">
            Agregadas/editadas ({added.length})
          </span>
          {added.slice(0, 5).map((r, i) => (
            <MiniRow key={i} headers={headers} row={r} tone="add" />
          ))}
          {added.length > 5 && (
            <p className="text-[10px] text-muted-foreground">+{added.length - 5} más…</p>
          )}
        </div>
      )}
      {added.length === 0 && removed.length === 0 && (
        <p className="text-[10px] text-muted-foreground italic">Cambios menores en la tabla.</p>
      )}
    </div>
  );
}

function ChangesView({
  entries,
  fieldLabels,
  onFieldClick,
}: {
  entries: FieldHistoryEntry[];
  fieldLabels: Record<string, string>;
  onFieldClick: (fieldKey: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-6">
        <History className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">Aún no hay cambios registrados.</p>
      </div>
    );
  }
  return (
    <div className="divide-y">
      {entries.map((e) => {
        const label = fieldLabels[e.field_key] || e.field_key;
        return (
          <div key={e.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
            <button
              onClick={() => onFieldClick(e.field_key)}
              className="text-[11px] font-semibold text-primary hover:underline truncate block w-full text-left mb-1"
            >
              {label}
            </button>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold shrink-0">
                  {e.author_name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[11px] font-medium text-foreground truncate">{e.author_name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(e.changed_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {parseTable(e.old_value) || parseTable(e.new_value) ? (
              <TableDiff oldVal={e.old_value} newVal={e.new_value} />
            ) : (
              <div className="space-y-1 text-[11px]">
                {e.old_value && (
                  <div className="rounded border border-destructive/20 bg-destructive/5 px-2 py-1">
                    <span className="text-[9px] uppercase tracking-wide text-destructive/70 font-semibold">Antes</span>
                    <p className="text-foreground/80 break-words">{truncate(e.old_value, 140)}</p>
                  </div>
                )}
                <div className="rounded border border-primary/20 bg-primary/5 px-2 py-1">
                  <span className="text-[9px] uppercase tracking-wide text-primary/70 font-semibold">Ahora</span>
                  <p className="text-foreground break-words">{truncate(e.new_value, 140)}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
