"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleOff, Copy, KeyRound, MailCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreatePasswordSetupLink } from "@/features/clinics/api/useCreatePasswordSetupLink";
import { ApiError } from "@/lib/api-client";

export function ClinicAccountActions({ clinicId, isActive }: { clinicId: string; isActive: boolean }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"suspend" | "delete" | null>(null);

  async function suspendClinic() {
    if (!window.confirm("¿Suspender la cuenta de esta clínica? Su página pública de alta dejará de aceptar miembros.")) return;

    setPending("suspend");
    setStatus(null);

    const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    setPending(null);

    if (!response.ok) {
      setStatus("No se pudo suspender la clínica.");
      return;
    }

    setStatus("Cuenta de la clínica suspendida.");
    router.refresh();
  }

  async function deleteClinic() {
    if (!window.confirm("¿Eliminar la cuenta de esta clínica junto con sus miembros, plantilla, tratamientos y datos de wallet? Esta acción no se puede deshacer.")) return;

    setPending("delete");
    setStatus(null);

    const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}`, {
      method: "DELETE",
    });

    setPending(null);

    if (!response.ok && response.status !== 404) {
      setStatus("No se pudo eliminar la clínica.");
      return;
    }

    router.push("/admin/clinics");
    router.refresh();
  }

  return (
    <div className="rounded-[26px] border border-[#ead1c9] bg-[#fff8f6] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b95c4d]">Gestión de la cuenta</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">Zona de riesgo</h2>
      <p className="mt-2 text-sm leading-6 text-[#806d63]">Suspender pausa el registro público de miembros. Eliminar borra la clínica y los datos de configuración asociados.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={suspendClinic} disabled={!isActive || pending !== null} className="rounded-2xl border-[#d8aaa0] text-[#8d3f34]">
          <CircleOff className="mr-2 h-4 w-4" /> {pending === "suspend" ? "Suspendiendo..." : isActive ? "Suspender cuenta" : "Suspendida"}
        </Button>
        <Button type="button" variant="destructive" onClick={deleteClinic} disabled={pending !== null} className="rounded-2xl">
          <Trash2 className="mr-2 h-4 w-4" /> {pending === "delete" ? "Eliminando..." : "Eliminar cuenta"}
        </Button>
      </div>
      {status ? <p className="mt-3 text-sm text-[#8d3f34]">{status}</p> : null}
    </div>
  );
}

export function ClinicCredentialsActions({ clinicId, email, setupUrl, setupTokenExpiresAt, generatedAt, sentAt, hasPassword, setPasswordLink = false }: { clinicId: string; email?: string; setupUrl?: string | null; setupTokenExpiresAt?: string | null; generatedAt?: string | null; sentAt?: string | null; hasPassword?: boolean; /** Onboarding: open the existing link instead of generating and emailing a new one. */ setPasswordLink?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [currentSetupUrl, setCurrentSetupUrl] = React.useState(setupUrl ?? null);
  const [currentSetupTokenExpiresAt, setCurrentSetupTokenExpiresAt] = React.useState(setupTokenExpiresAt ?? null);
  const [copied, setCopied] = React.useState(false);

  const setupMutation = useCreatePasswordSetupLink({
    onSuccess: (result) => {
      setCurrentSetupUrl(result.setupUrl);
      setCurrentSetupTokenExpiresAt(result.setupTokenExpiresAt);
      setCopied(false);
      setStatus(result.emailSent ? "Enlace para configurar la contraseña generado y enviado por email." : "Enlace para configurar la contraseña generado. No se envió el email; copia el enlace manualmente.");
      router.refresh();
    },
    onError: (error) => {
      setStatus(error instanceof ApiError && error.detail ? error.detail : "No se pudo generar el enlace para configurar la contraseña.");
    },
  });

  function shareCredentials() {
    if (!email) return;
    if (!window.confirm(`¿Generar un nuevo enlace para que ${email} cree su contraseña? Los enlaces anteriores sin usar de este propietario dejarán de funcionar.`)) return;

    setStatus(null);
    setCopied(false);
    setupMutation.mutate(clinicId);
  }

  async function copySetupLink() {
    if (!currentSetupUrl) return;

    await navigator.clipboard.writeText(currentSetupUrl);
    setCopied(true);
  }

  return (
    <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Acceso del cliente</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Credenciales de acceso</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <CredentialFact label="Email de acceso" value={email ?? "Sin email de propietario guardado"} />
        <CredentialFact label="Contraseña" value={hasPassword ? "Definida por la clínica" : "Aún sin definir"} />
        <CredentialFact label="Generado" value={generatedAt ? new Date(generatedAt).toLocaleString("es-ES") : "Sin generar"} />
        <CredentialFact label="Último envío" value={sentAt ? new Date(sentAt).toLocaleString("es-ES") : "Nunca enviado"} />
      </div>
      <div className="mt-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Configurar contraseña</p>
        {currentSetupUrl ? (
          <div className="mt-2 flex flex-col gap-3">
            <code className="break-all rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#2e2421]">{currentSetupUrl}</code>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[#806d63]">
                {currentSetupTokenExpiresAt ? `Caduca el ${new Date(currentSetupTokenExpiresAt).toLocaleString("es-ES")}` : "Enlace de un solo uso"}
              </span>
              <Button type="button" variant="outline" onClick={copySetupLink} className="rounded-xl">
                <Copy className="mr-2 h-4 w-4" /> {copied ? "Copiado" : "Copiar enlace"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[#2e2421]">No hay ningún enlace activo</p>
        )}
      </div>
      {setPasswordLink ? (
        currentSetupUrl ? (
          <Button asChild className="mt-5 rounded-2xl">
            <a href={currentSetupUrl} target="_blank" rel="noopener noreferrer">
              <KeyRound className="mr-2 h-4 w-4" /> Establecer contraseña
            </a>
          </Button>
        ) : null
      ) : (
        <Button type="button" onClick={shareCredentials} disabled={!email || setupMutation.isPending} className="mt-5 rounded-2xl">
          <MailCheck className="mr-2 h-4 w-4" /> {setupMutation.isPending ? "Generando..." : "Generar enlace"}
        </Button>
      )}
      <p className="mt-3 text-xs leading-5 text-[#806d63]">El propietario de la clínica usa este enlace de un solo uso para crear su propia contraseña. La contraseña permanece vacía hasta que envíe el formulario.</p>
      {status ? <p className="mt-3 text-sm text-[#704f40]">{status}</p> : null}
    </div>
  );
}

function CredentialFact({ label, value }: { label: string; value: string }) {
  return <p className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">{label}</span><span className="mt-1 block text-sm font-semibold text-[#2e2421]">{value}</span></p>;
}