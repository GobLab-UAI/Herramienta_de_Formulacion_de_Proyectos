import { ReactNode } from "react";
import logoGoblab from "@/assets/logo-goblab-uai.png";
import logoHerramientas from "@/assets/logo-herramientas-eticas.png";

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

export function BrandLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-6 w-full ${className}`}>
      <img
        src={logoGoblab}
        alt="GobLab UAI - Universidad Adolfo Ibáñez"
        className="h-10 md:h-12 w-auto object-contain"
      />
      <img
        src={logoHerramientas}
        alt="Herramientas Algoritmos Éticos"
        className="h-10 md:h-12 w-auto object-contain"
      />
    </div>
  );
}

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary flex-col justify-between p-12">
        <div className="bg-white rounded-lg p-4 shadow-goblab-sm">
          <BrandLogos />
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-display text-secondary-foreground leading-tight">
            Diseña proyectos de IA y ciencia de datos viables y responsables
          </h1>
          <p className="font-display text-xl text-secondary-foreground/90">
            Portal de Evaluación de Proyectos de IA
          </p>
          <p className="text-lg text-secondary-foreground/70 max-w-md">
            Colabora con tu equipo usando la metodología GobLab UAI para formular proyectos de impacto.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-secondary-foreground/50">
            GobLab Ficha de Proyecto · Proyecto financiado por ANID · CC BY-SA 3.0 · goblab.uai.cl
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-4">
            <BrandLogos />
          </div>
          <div className="lg:hidden">
            <span className="font-display text-lg text-foreground">Portal de Evaluación de Proyectos de IA</span>
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
