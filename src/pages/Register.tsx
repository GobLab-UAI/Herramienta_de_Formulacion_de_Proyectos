import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    cargo: "",
    entidad: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos obligatorios.", variant: "destructive" });
      return;
    }

    if (form.password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            username: form.username.trim(),
            cargo: form.cargo.trim() || null,
            entidad: form.entidad.trim() || null,
          },
        },
      });

      if (error) {
        toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "¡Cuenta creada!", description: "Bienvenido/a a GobLab Ficha." });
        navigate("/dashboard");
      }
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "username", label: "Nombre de usuario *", placeholder: "ej: jperez", type: "text" },
    { key: "full_name", label: "Nombre completo *", placeholder: "Juan Pérez", type: "text" },
    { key: "email", label: "Correo electrónico *", placeholder: "juan@ejemplo.cl", type: "email" },
    { key: "cargo", label: "Cargo", placeholder: "Analista de datos", type: "text" },
    { key: "entidad", label: "Entidad", placeholder: "Ministerio de...", type: "text" },
    { key: "password", label: "Contraseña *", placeholder: "Mínimo 6 caracteres", type: "password" },
  ];

  return (
    <AuthLayout title="Registro de Formulador" subtitle="Crea tu cuenta para formular proyectos de IA y ciencia de datos">
      <form onSubmit={handleRegister} className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              type={f.type}
              value={(form as any)[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              autoComplete={f.key === "password" ? "new-password" : f.key}
            />
          </div>
        ))}
        <Button type="submit" className="w-full" disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? "Registrando..." : "Crear cuenta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
