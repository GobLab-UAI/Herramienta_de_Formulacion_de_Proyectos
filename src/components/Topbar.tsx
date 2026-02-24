import { GobLabLogo } from "@/components/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-card px-6 shadow-goblab-sm">
      <Link to="/dashboard" className="flex items-center gap-2.5">
        <GobLabLogo size={32} />
        <span className="font-display text-lg text-foreground hidden sm:inline">GobLab Ficha</span>
      </Link>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
              {profile?.email}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
