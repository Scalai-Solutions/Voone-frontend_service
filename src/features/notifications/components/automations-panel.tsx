"use client";

import * as React from "react";

import type { NotifyOnCredit } from "@/lib/api-client";

import { useNotificationSettings } from "../use-notification-settings";
import { errorText, type NotificationSettingsApi } from "../settings-api";
import { AutomationCard } from "./automation-card";

const CREDIT_OPTIONS: Array<{ value: NotifyOnCredit; label: string }> = [
  { value: "NEVER", label: "Nunca" },
  { value: "MILESTONE_AND_TIER", label: "Al conseguir un premio" },
  { value: "ALWAYS", label: "En cada visita" },
];

/**
 * Every automatic message of a centre, in one place: used by the onboarding step and by the
 * clinic dashboard's notification centre, so both always offer the same events, the same
 * editor and the same rules. The list comes from the backend catalog, so a new automation
 * appears here without any change to this component.
 */
export function AutomationsPanel({
  api,
  clinicName = "Tu centro",
}: {
  api: NotificationSettingsApi;
  clinicName?: string;
}) {
  const { settings, catalog, patch } = useNotificationSettings(api);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [generalError, setGeneralError] = React.useState<string | null>(null);

  if (settings.isError || catalog.isError) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-[#e4d8d1] bg-white/78 p-5 text-sm text-[#b94135]"
      >
        {errorText(
          settings.error ?? catalog.error,
          "No se pudieron cargar las comunicaciones automáticas.",
        )}
      </p>
    );
  }

  if (!settings.data || !catalog.data) {
    return (
      <p className="rounded-2xl border border-[#e4d8d1] bg-white/78 p-5 text-sm text-[#806d63]">
        Cargando…
      </p>
    );
  }

  const current = settings.data;
  const save = (input: Parameters<typeof patch.mutateAsync>[0]) =>
    patch.mutateAsync(input);
  const saveGeneral = async (
    input: Parameters<typeof patch.mutateAsync>[0],
  ) => {
    setGeneralError(null);
    try {
      await patch.mutateAsync(input);
    } catch (error) {
      setGeneralError(errorText(error, "No se pudo guardar."));
    }
  };
  const activeCount = catalog.data.filter(
    (entry) => current.automations[entry.event].enabled,
  ).length;

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[#806d63]">
        {activeCount} de {catalog.data.length} automatizaciones activas. Cada
        cambio se guarda por separado.
      </p>

      {catalog.data.map((entry) => (
        <AutomationCard
          key={entry.event}
          entry={entry}
          setting={current.automations[entry.event]}
          clinic={current}
          clinicName={clinicName}
          expanded={expanded === entry.event}
          onToggleExpand={() =>
            setExpanded(expanded === entry.event ? null : entry.event)
          }
          onSave={save}
        />
      ))}

      <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
        <p className="font-semibold">Ajustes generales</p>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={current.marketingEnabled}
            disabled={patch.isPending}
            onChange={(event) =>
              saveGeneral({ marketingEnabled: event.target.checked })
            }
            className="mt-1 h-4 w-4 accent-[#201715]"
          />
          <span>
            <span className="block font-semibold">Mensajes promocionales</span>
            <span className="block text-xs text-[#806d63]">
              Cumpleaños, reseñas, referidos y envíos manuales. Los avisos de
              servicio (bonos, subida de nivel) no dependen de este ajuste.
            </span>
          </span>
        </label>
        <div className="mt-3 text-sm">
          <label htmlFor="notify-on-credit" className="font-semibold">
            Avisar al sumar puntos
          </label>
          <select
            id="notify-on-credit"
            value={current.notifyOnCredit}
            disabled={patch.isPending}
            onChange={(event) =>
              saveGeneral({
                notifyOnCredit: event.target.value as NotifyOnCredit,
              })
            }
            className="mt-1 block w-full max-w-xs rounded-xl border border-[#cdb9aa] bg-white px-3 py-2 text-sm"
          >
            {CREDIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {generalError ? (
          <p role="alert" className="mt-2 text-sm text-[#b94135]">
            {generalError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
