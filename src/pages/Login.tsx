import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const CONSULTOR_EMAIL = "admin2026@goblab.local";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      let email: string;

      if (username.trim().toLowerCase() === "admin2026") {
        email = CONSULTOR_EMAIL;
      } else {
        // Look up email by username
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", username.trim())
          .single();

        if (profileError || !profile) {
          toast({ title: "Usuario no encontrado", description: "Verifica tu nombre de usuario.", variant: "destructive" });
          setLoading(false);
          return;
        }
        email = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({ title: "Error al iniciar sesión", description: "Credenciales incorrectas.", variant: "destructive" });
      } else {
        // Register in tool_users (ignore duplicate)
        await supabase.from("tool_users" as any).insert({
          email: email.trim().toLowerCase(),
          tool_name: "herramienta formulacion",
        } as any);
        navigate(safeNext);
      }
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresa con tu nombre de usuario y contraseña">
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu nombre de usuario"
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="mr-2 h-4 w-4" />
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Regístrate como formulador
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
