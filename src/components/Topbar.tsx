import { GobLabLogo } from "@/components/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export function Topbar() {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-card px-6 shadow-goblab-sm">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <GobLabLogo size={32} />
        <span className="font-display text-lg text-foreground hidden sm:inline">GobLab Ficha</span>
      </Link>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          role === "CONSULTOR"
            ? "bg-amber-bg text-amber border border-amber/30"
            : "bg-accent text-accent-foreground"
        }`}>
          {role === "CONSULTOR" ? "Consultor" : "Formulador"}
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
