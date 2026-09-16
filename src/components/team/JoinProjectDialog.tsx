import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Pencil, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_SUGGESTIONS = [
  "Líder de proyecto",
  "Administrador de recursos",
  "Líder de TI",
  "Coordinador de ciencia de datos",
  "Científico de datos",
];

const CODE_REGEX = /^[A-Z]{3}\d{3}$/;

export function JoinProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user, isDocente } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [joinAs, setJoinAs] = useState<"FORMULADOR" | "COMENTARISTA">("FORMULADOR");

  const join = useMutation({
    mutationFn: async () => {
      if (isDocente && joinAs !== "COMENTARISTA") setJoinAs("COMENTARISTA");
      const upper = code.trim().toUpperCase();
      if (!CODE_REGEX.test(upper)) throw new Error("El código debe tener 3 letras y 3 números (ej. ABC123).");
      if (!customRole.trim()) throw new Error("Indica tu rol en el proyecto.");

      const { data: matches, error } = await supabase
        .rpc("find_project_by_join_code", { _code: upper });
      if (error) throw error;
      const project = matches?.[0];
      if (!project) throw new Error("No encontramos un proyecto con ese código.");

      // Check if already a member
      const { data: existing } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("project_id", project.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (existing) {
        return project;
      }

      const { error: insertError } = await supabase
        .from("project_members")
        .insert({
          project_id: project.id,
          user_id: user!.id,
          role: isDocente ? "COMENTARISTA" : joinAs,
          custom_role: customRole.trim(),
          joined_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Te uniste al proyecto", description: project.title });
      setOpen(false);
      setCode(""); setCustomRole(""); setJoinAs("FORMULADOR");
      navigate(`/projects/${project.id}/edit`);
    },
    onError: (e: any) => {
      toast({ title: "No se pudo unir", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-1" /> Unirme a un proyecto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unirme a un proyecto</DialogTitle>
          <DialogDescription>
            Ingresa el código de 6 caracteres (3 letras + 3 números) que te compartió el responsable del proyecto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Código del proyecto</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              className="font-mono tracking-[0.3em] uppercase text-center text-lg"
              maxLength={6}
            />
          </div>
          <div className={cn("space-y-1.5", isDocente && "hidden")}>
            <Label>¿Cómo quieres unirte?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJoinAs("FORMULADOR")}
                className={cn(
                  "rounded-md border p-3 text-left transition-colors",
                  joinAs === "FORMULADOR"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Pencil className="h-4 w-4" /> Formulador
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Edita el formulario y deja comentarios.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setJoinAs("COMENTARISTA")}
                className={cn(
                  "rounded-md border p-3 text-left transition-colors",
                  joinAs === "COMENTARISTA"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" /> Comentarista
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Solo puede leer y dejar comentarios. No edita el texto.
                </p>
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mi rol en el proyecto</Label>
            <Input
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Ej. Científico de Datos"
              list="role-suggestions"
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
            </datalist>
            <p className="text-[11px] text-muted-foreground">
              Sugerencias: {ROLE_SUGGESTIONS.join(" · ")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => join.mutate()} disabled={join.isPending}>
            {join.isPending ? "Uniendo..." : "Unirme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}