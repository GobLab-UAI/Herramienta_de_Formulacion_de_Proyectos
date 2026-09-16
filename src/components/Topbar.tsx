import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap } from "lucide-react";
import logoGoblab from "@/assets/logo-goblab-uai.png";
import logoHerramientas from "@/assets/logo-herramientas-eticas.png";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Superadmin",
  CONSULTOR: "Consultor",
  DOCENTE: "Docente",
  FORMULADOR: "Formulador",
};

export function Topbar() {
  const { profile, role, isSuperadmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-card px-6 shadow-goblab-sm">
      <Link to="/dashboard" className="flex items-center gap-4 min-w-0">
        <img src={logoHerramientas} alt="Herramientas Algoritmos Éticos" className="h-8 w-auto object-contain" />
        <span className="font-display text-base lg:text-lg text-foreground hidden md:inline truncate">
          Herramienta de Evaluación de Proyectos de IA
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {isSuperadmin && (
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/admin/docentes">
              <GraduationCap className="h-4 w-4 mr-1" />
              Docentes
            </Link>
          </Button>
        )}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          role === "CONSULTOR" || role === "ADMIN"
            ? "bg-amber-bg text-amber border border-amber/30"
            : role === "DOCENTE"
              ? "bg-muted text-muted-foreground border border-border"
              : "bg-accent text-accent-foreground"
        }`}>
          {ROLE_LABELS[role] || "Formulador"}
        </span>
        <span className="text-sm text-foreground font-medium hidden sm:inline">
          {profile?.full_name || profile?.username || "Usuario"}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1" />
          Salir
        </Button>
      </div>
    </header>
  );
}
