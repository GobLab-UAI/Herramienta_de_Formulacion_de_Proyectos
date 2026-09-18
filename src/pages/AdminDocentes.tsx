import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, UserPlus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminDocentes() {
  const { isSuperadmin, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: docentes = [] } = useQuery({
    queryKey: ["docentes"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "DOCENTE" as any);
      const ids = (roles || []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, email, created_at")
        .in("id", ids);
      return data || [];
    },
    enabled: isSuperadmin,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-docente", {
        body: { full_name: fullName, email, username, password },
      });
      if (error) {
        const detail = (data as any)?.error;
        throw new Error(detail || error.message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Cuenta docente creada", description: `${username} ya puede iniciar sesión.` });
      setFullName(""); setEmail(""); setUsername(""); setPassword("");
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
    },
    onError: (e: any) => {
      toast({ title: "No se pudo crear la cuenta", description: e.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-docente", {
        body: { user_id: userId },
      });
      if (error) {
        const detail = (data as any)?.error;
        throw new Error(detail || error.message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Cuenta docente eliminada" });
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
    },
    onError: (e: any) => {
      toast({ title: "No se pudo eliminar la cuenta", description: e.message, variant: "destructive" });
    },
  });

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;
  }
  if (!isSuperadmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-foreground flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> Cuentas docente
          </h1>
          <p className="mt-1 text-muted-foreground">
            Crea las cuentas de docentes. Solo pueden leer y comentar los proyectos a los que se unan con el código de invitación.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-display">Nueva cuenta docente</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ana Pérez" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@uai.cl" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="aperez" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña temporal</Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={create.isPending}>
                  <UserPlus className="mr-1 h-4 w-4" />
                  {create.isPending ? "Creando..." : "Crear cuenta docente"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Docentes registrados ({docentes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {docentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay cuentas docente.</p>
            ) : (
              <ul className="divide-y">
                {docentes.map((d: any) => (
                  <li key={d.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-foreground">{d.full_name || d.username}</p>
                      <p className="text-xs text-muted-foreground">{d.username} · {d.email}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={remove.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar la cuenta docente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará la cuenta de {d.full_name || d.username} ({d.username}) y perderá el acceso a los proyectos
                            a los que se había unido. Los comentarios que dejó se conservan. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove.mutate(d.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
