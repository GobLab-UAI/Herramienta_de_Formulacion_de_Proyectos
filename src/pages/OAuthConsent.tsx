import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";

type SupabaseOAuth = {
  getAuthorizationDetails(id: string): Promise<{ data: any; error: any }>;
  approveAuthorization(id: string): Promise<{ data: any; error: any }>;
  denyAuthorization(id: string): Promise<{ data: any; error: any }>;
};

function oauthClient(): SupabaseOAuth {
  return (supabase.auth as unknown as { oauth: SupabaseOAuth }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Falta el parámetro authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauthClient().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message ?? "No se pudo cargar la solicitud.");
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Error inesperado.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const oauth = oauthClient();
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message ?? "No se pudo completar la acción.");
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("El servidor de autorización no devolvió una URL de redirección.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? "Error inesperado.");
    }
  }

  if (error) {
    return (
      <AuthLayout title="Conexión no disponible" subtitle="No pudimos procesar esta solicitud.">
        <p className="text-sm text-destructive">{error}</p>
      </AuthLayout>
    );
  }

  if (!details) {
    return (
      <AuthLayout title="Preparando la conexión…" subtitle="Verificando tu sesión y la solicitud de acceso.">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </AuthLayout>
    );
  }

  const clientName: string = details.client?.name ?? details.client?.client_name ?? "una aplicación externa";

  return (
    <AuthLayout
      title={`Conectar ${clientName}`}
      subtitle="Esto permite que la aplicación use la Herramienta de Evaluación de Proyectos de IA en tu nombre."
    >
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{clientName}</p>
          <p className="text-muted-foreground text-xs mt-1">
            Podrá listar tus proyectos, leer sus respuestas y comentarios, y dejar comentarios en tu nombre mientras
            estés conectado.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            No omite las políticas de acceso: solo verá lo que tú puedes ver.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button onClick={() => decide(true)} disabled={busy} className="w-full sm:w-auto">
            {busy ? "Procesando…" : "Aprobar y conectar"}
          </Button>
          <Button
            onClick={() => decide(false)}
            disabled={busy}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}