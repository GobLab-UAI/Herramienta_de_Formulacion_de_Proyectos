import { ReactNode } from "react";
import { Github } from "lucide-react";
import logoGoblab from "@/assets/logo-goblab-uai.png";
import logoHerramientas from "@/assets/logo-herramientas-eticas.png";
import logoAnid from "@/assets/logo-anid.png";

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
    <div className={`flex items-center justify-center gap-6 w-full ${className}`}>
      <img
        src={logoGoblab}
        alt="GobLab UAI - Universidad Adolfo Ibáñez"
        className="h-8 md:h-10 w-auto object-contain"
      />
      <img
        src={logoHerramientas}
        alt="Herramientas Algoritmos Éticos"
        className="h-8 md:h-10 w-auto object-contain"
      />
    </div>
  );
}

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary flex-col justify-between p-12">
        <div />
        <div className="space-y-6">
          <h1 className="text-4xl font-display text-secondary-foreground leading-tight">
            Diseña proyectos de IA y ciencia de datos viables y responsables
          </h1>
          <p className="font-display text-xl text-secondary-foreground/90">
            Herramienta de Formulación de Proyectos de IA
          </p>
          <p className="text-lg text-secondary-foreground/70 max-w-md">
            Colabora con tu equipo usando la metodología GobLab UAI para formular proyectos de impacto.
          </p>
        </div>
        <div className="space-y-6">
          <div className="pt-4 space-y-3">
            <p className="text-sm text-secondary-foreground/70 font-medium">
              Agradecimientos a:
            </p>
            <div className="bg-white rounded-md p-3 inline-block">
              <img
                src={logoAnid}
                alt="Agencia Nacional de Investigación y Desarrollo (ANID)"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 flex-col p-8 bg-card">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="mb-4">
              <BrandLogos />
            </div>
            <div className="lg:hidden text-center">
              <span className="font-display text-lg text-foreground">Herramienta de Formulación de Proyectos de IA</span>
            </div>
            <div>
              <h2 className="text-2xl font-display text-foreground">{title}</h2>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
        <div className="w-full max-w-md mx-auto pt-6 border-t border-border">
          <div className="flex items-center justify-between gap-3 text-sm text-foreground">
            <span className="font-medium">Nuestra herramienta es de código abierto</span>
            <a
              href="https://github.com/johanpina/herramienta-forproyectos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
