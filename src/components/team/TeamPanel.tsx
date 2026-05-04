import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Users, Copy, Crown, Trash2, Check, Pencil } from "lucide-react";

interface Member {
  user_id: string;
  custom_role: string | null;
  is_owner: boolean | null;
  joined_at: string | null;
  full_name?: string;
  username?: string;
}

export function TeamPanel({ projectId, joinCode, ownerId }: { projectId: string; joinCode: string; ownerId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const isOwner = user?.id === ownerId;

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("project_members")
        .select("user_id, custom_role, is_owner, joined_at")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true });
      const ids = (rows || []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles").select("id, full_name, username").in("id", ids);
      const pmap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return (rows || []).map((r) => ({
        ...r,
        full_name: pmap[r.user_id]?.full_name,
        username: pmap[r.user_id]?.username,
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("project_members")
        .update({ custom_role: role })
        .eq("project_id", projectId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      setEditing(null);
      toast({ title: "Rol actualizado" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("project_members").delete()
        .eq("project_id", projectId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast({ title: "Miembro removido" });
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast({ title: "Código copiado", description: joinCode });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Users className="h-3.5 w-3.5 mr-1" /> Equipo ({members.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Equipo del proyecto</SheetTitle>
          <SheetDescription>
            Comparte el código para que más personas se unan a colaborar.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Código de invitación</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-2xl tracking-[0.3em] text-center py-3 bg-muted rounded-md text-primary">
              {joinCode}
            </code>
            <Button variant="outline" size="icon" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Miembros</p>
          {members.map((m) => {
            const name = m.full_name || m.username || "Usuario";
            const canEditOwn = m.user_id === user?.id;
            const canRemove = isOwner && !m.is_owner;
            const isEditingThis = editing === m.user_id;
            return (
              <div key={m.user_id} className="rounded-lg border p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        {name}
                        {m.is_owner && <Crown className="h-3 w-3 text-amber" />}
                      </p>
                      {!isEditingThis && (
                        <p className="text-xs text-muted-foreground truncate">{m.custom_role || "—"}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {canEditOwn && !isEditingThis && (
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditing(m.user_id); setEditValue(m.custom_role || ""); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canRemove && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => removeMember.mutate(m.user_id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {isEditingThis && (
                  <div className="mt-2 flex gap-1">
                    <Input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Mi rol" className="h-8 text-xs" />
                    <Button size="icon" className="h-8 w-8" onClick={() => updateRole.mutate({ userId: m.user_id, role: editValue.trim() })}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}