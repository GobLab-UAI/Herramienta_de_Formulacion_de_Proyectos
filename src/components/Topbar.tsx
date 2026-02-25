import { GobLabLogo } from "@/components/AuthLayout";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Topbar() {
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-card px-6 shadow-goblab-sm">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <GobLabLogo size={32} />
        <span className="font-display text-lg text-foreground hidden sm:inline">GobLab Ficha</span>
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Vista:</span>
        <Button
          variant={role === "FORMULADOR" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setRole("FORMULADOR")}
        >
          Formulador
        </Button>
        <Button
          variant={role === "CONSULTOR" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setRole("CONSULTOR")}
        >
          Consultor
        </Button>
      </div>
    </header>
  );
}
