import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderOpen, FolderPlus, Pencil, Trash2, Check, X, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

export interface FolderRow {
  id: string;
  name: string;
  position: number;
}

export function useFolders(userId?: string) {
  const folders = useQuery({
    queryKey: ["user_folders", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("user_folders")
        .select("id, name, position")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as FolderRow[];
    },
    enabled: !!userId,
  });

  const items = useQuery({
    queryKey: ["user_folder_projects", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("user_folder_projects")
        .select("folder_id, project_id");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.project_id] = r.folder_id; });
      return map;
    },
    enabled: !!userId,
  });

  return { folders: folders.data || [], projectFolder: items.data || {}, isLoading: folders.isLoading };
}

export function FolderBar({
  userId,
  folders,
  projectFolder,
  activeFolder,
  onSelectFolder,
}: {
  userId: string;
  folders: FolderRow[];
  projectFolder: Record<string, string>;
  activeFolder: string | null;
  onSelectFolder: (id: string | null) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["user_folders"] });
    qc.invalidateQueries({ queryKey: ["user_folder_projects"] });
  };

  const createFolder = useMutation({
    mutationFn: async () => {
      const { data, error } = await db
        .from("user_folders")
        .insert({ user_id: userId, name: "Nueva carpeta", position: folders.length })
        .select("id, name, position")
        .single();
      if (error) throw error;
      return data as FolderRow;
    },
    onSuccess: (f) => {
      refresh();
      setEditingId(f.id);
      setEditName(f.name);
    },
    onError: (e: any) => toast({ title: "No se pudo crear la carpeta", description: e.message, variant: "destructive" }),
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await db.from("user_folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      // Los proyectos vuelven a "Sin carpeta"
      const { error: itemsError } = await db
        .from("user_folder_projects")
        .delete()
        .eq("folder_id", id)
        .eq("user_id", userId);
      if (itemsError) throw itemsError;
      const { error } = await db.from("user_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      if (activeFolder === id) onSelectFolder(null);
      refresh();
      toast({ title: "Carpeta eliminada" });
    },
  });

  const moveProject = useMutation({
    mutationFn: async ({ projectId, folderId }: { projectId: string; folderId: string | null }) => {
      if (!folderId) {
        const { error } = await db.from("user_folder_projects").delete().eq("project_id", projectId).eq("user_id", userId);
        if (error) throw error;
        return;
      }
      const { error } = await db
        .from("user_folder_projects")
        .upsert({ user_id: userId, project_id: projectId, folder_id: folderId }, { onConflict: "user_id,project_id" });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: any) => toast({ title: "No se pudo mover el proyecto", description: e.message, variant: "destructive" }),
  });

  const handleDrop = (folderId: string | null) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const projectId = e.dataTransfer.getData("text/project-id");
    if (!projectId) return;
    if ((projectFolder[projectId] || null) === folderId) return;
    moveProject.mutate({ projectId, folderId });
  };

  const counts: Record<string, number> = {};
  Object.values(projectFolder).forEach((fid) => { counts[fid] = (counts[fid] || 0) + 1; });

  const zoneClass = (key: string, active: boolean) =>
    `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
      dragOver === key
        ? "border-primary bg-primary/10 border-dashed"
        : active
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card hover:bg-muted"
    }`;

  return (
    <div className="mb-6 rounded-xl border bg-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mis carpetas · arrastra un proyecto para guardarlo
        </p>
        <Button size="sm" variant="outline" onClick={() => createFolder.mutate()} disabled={createFolder.isPending}>
          <FolderPlus className="h-4 w-4 mr-1" /> Nueva carpeta
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => { e.preventDefault(); setDragOver("__none__"); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={handleDrop(null)}
          className={zoneClass("__none__", activeFolder === null)}
        >
          <Inbox className="h-4 w-4 shrink-0" />
          <span>Todos / sin carpeta</span>
        </button>

        {folders.map((f) => {
          const active = activeFolder === f.id;
          return (
            <div
              key={f.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(f.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop(f.id)}
              className={zoneClass(f.id, active)}
            >
              {editingId === f.id ? (
                <>
                  <Folder className="h-4 w-4 shrink-0" />
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { renameFolder.mutate({ id: f.id, name: editName.trim() || f.name }); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-7 w-40 text-sm"
                  />
                  <button onClick={() => { renameFolder.mutate({ id: f.id, name: editName.trim() || f.name }); setEditingId(null); }} title="Guardar">
                    <Check className="h-4 w-4 text-primary" />
                  </button>
                  <button onClick={() => setEditingId(null)} title="Cancelar">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onSelectFolder(active ? null : f.id)} className="flex items-center gap-2">
                    {active ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
                    <span>{f.name}</span>
                    <span className="text-xs text-muted-foreground">{counts[f.id] || 0}</span>
                  </button>
                  <button onClick={() => { setEditingId(f.id); setEditName(f.name); }} title="Renombrar" className="text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteFolder.mutate(f.id)} title="Eliminar carpeta" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
