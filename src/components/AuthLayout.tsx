import { ReactNode } from "react";

export function GobLabLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="hsl(174 100% 35%)" />
      <rect x="8" y="10" width="16" height="10" rx="2" fill="white" opacity="0.9" />
      <rect x="12" y="16" width="16" height="10" rx="2" fill="white" opacity="0.6" />
      <rect x="16" y="22" width="16" height="10" rx="2" fill="white" opacity="0.35" />
    </svg>
  );
}

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <GobLabLogo size={40} />
          <span className="font-display text-2xl text-secondary-foreground">GobLab Ficha</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-display text-secondary-foreground leading-tight">
            Diseña proyectos de IA y ciencia de datos para el sector público
          </h1>
          <p className="text-lg text-secondary-foreground/70 max-w-md">
            Colabora con tu equipo usando la metodología GobLab UAI para formular proyectos de impacto.
          </p>
        </div>
        <p className="text-sm text-secondary-foreground/50">
          GobLab UAI · CC BY-SA 3.0 · goblab.uai.cl
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <GobLabLogo size={36} />
            <span className="font-display text-xl text-foreground">GobLab Ficha</span>
          </div>
          <div>
            <h2 className="text-2xl font-display text-foreground">{title}</h2>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
