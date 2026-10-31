"use client";

import * as React from "react";
import { Check, Download, LifeBuoy, Loader2, Save } from "lucide-react";

import { useMembers } from "@/features/members/api/useMembers";
import {
  ApiError,
  getNotificationSettings,
  patchNotificationSettings,
  type NotificationSettings,
} from "@/lib/api-client";

const messageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.detail ? error.detail : fallback;

export function MembersCsvExport() {
  const members = useMembers();

  function downloadCsv() {
    const data = members.data ?? [];
    const headers = ["Nombre", "Código", "Identificación", "Email", "Nivel", "Puntos", "Dinero gastado", "Última visita"];
    const escape = (value: string | number | null | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = data.map((member) => [
      member.name,
      member.code ?? "",
      member.identity,
      member.email ?? "",
      member.tier,
      member.points,
      member.moneySpent,
      member.lastVisitedAt ?? "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "members.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={downloadCsv}
      disabled={members.isLoading || members.isError}
      className="mt-4 inline-flex items-center rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="mr-2 h-4 w-4" />
      {members.isLoading ? "Cargando miembros..." : "Descargar CSV de miembros"}
    </button>
  );
}

export function NotificationSettingsToggle({ clinicId }: { clinicId: string }) {
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [state, setState] = React.useState<"loading" | "idle" | "saving" | "error">("loading");
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void getNotificationSettings(clinicId)
      .then((value) => {
        if (cancelled) return;
        setSettings(value);
        setState("idle");
      })
      .catch((error) => {
        if (cancelled) return;
        setState("error");
        setMessage(messageOf(error, "No se pudieron cargar las preferencias."));
      });

    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  async function toggleMarketing(enabled: boolean) {
    if (!settings) return;

    setState("saving");
    setMessage(null);

    try {
      const saved = await patchNotificationSettings(clinicId, {
        marketingEnabled: enabled,
      });

      setSettings(saved);
      setState("idle");
      setMessage(enabled ? "Notificaciones activadas." : "Notificaciones desactivadas.");
    } catch (error) {
      setState("error");
      setMessage(messageOf(error, "No se pudieron guardar las preferencias."));
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-[#806d63]">Cargando preferencias...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
        <div>
          <p className="font-semibold">Notificaciones de marketing</p>
          <p className="mt-1 text-xs text-[#806d63]">Controla envíos manuales, segmentos y automatizaciones de comunicación.</p>
        </div>
        <button
          type="button"
          onClick={() => void toggleMarketing(!(settings?.marketingEnabled ?? false))}
          disabled={state === "saving" || !settings}
          className={(settings?.marketingEnabled ?? false) ? "h-6 w-11 rounded-full bg-[#6b9a72] p-1" : "h-6 w-11 rounded-full bg-[#d8ccc4] p-1"}
          aria-label="Cambiar notificaciones"
        >
          <span className={(settings?.marketingEnabled ?? false) ? "block h-4 w-4 translate-x-5 rounded-full bg-white" : "block h-4 w-4 rounded-full bg-white"} />
        </button>
      </div>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-[#b94135]" : "text-sm font-semibold text-[#3d6a48]"}>{message}</p> : null}
    </div>
  );
}

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [state, setState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/staff/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "No se pudo cambiar la contraseña.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setState("saved");
      setMessage("Contraseña actualizada.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-sm font-semibold">
        Contraseña actual
        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Nueva contraseña
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" className="mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none" />
        </label>
        <label className="text-sm font-semibold">
          Confirmar contraseña
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="mt-2 h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none" />
        </label>
      </div>
      <button type="submit" disabled={state === "saving" || !currentPassword || !newPassword || !confirmPassword} className="inline-flex w-fit items-center rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {state === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : state === "saved" ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        Cambiar contraseña
      </button>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-[#b94135]" : "text-sm font-semibold text-[#3d6a48]"}>{message}</p> : null}
    </form>
  );
}

export function DeactivationRequest({ clinicName }: { clinicName: string }) {
  const subject = encodeURIComponent(`Request deactivation for ${clinicName}`);
  const body = encodeURIComponent(`Hello Voone support,\n\nPlease deactivate the center ${clinicName}.\n\nReason:\n`);

  return (
    <a href={`mailto:support@voone.ai?subject=${subject}&body=${body}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#b94135] px-4 py-2 text-sm font-semibold text-white">
      <LifeBuoy className="h-4 w-4" /> Request deactivation
    </a>
  );
}
