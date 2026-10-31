"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { CharCounter } from "@/components/shared/char-counter";
import type {
  AutomationCatalogEntry,
  AutomationSetting,
  ClinicVariableKey,
  NotificationSettings,
  NotificationSettingsPatch,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { errorText } from "../settings-api";
import {
  VARIABLE_LABELS,
  missingClinicValue,
  renderPreview,
  sampleValues,
  unknownVariables,
} from "../template";
import { DeactivationDialog } from "./deactivation-dialog";
import { PushPreview } from "./push-preview";

type Save = (patch: NotificationSettingsPatch) => Promise<unknown>;
type Notice = { ok: boolean; text: string } | null;

/** The clinic-level value an event needs, and how to ask for it. */
const CLINIC_FIELDS: Record<
  ClinicVariableKey,
  {
    label: string;
    help: string;
    placeholder: string;
    type: "url" | "text";
    max: number;
  }
> = {
  googleReviewUrl: {
    label: "Enlace de reseñas de Google",
    help: "En Google Business Profile: tu ficha > «Pedir reseñas» > copia el enlace. Debe empezar por https://",
    placeholder: "https://g.page/r/…/review",
    type: "url",
    max: 500,
  },
  referralRewardText: {
    label: "Recompensa por referido",
    help: "Lo que reciben tú y tu cliente por cada amigo que venga de su parte. Aparece en el mensaje.",
    placeholder: "10 € de descuento en tu próximo tratamiento",
    type: "text",
    max: 120,
  },
};

const statusTag = (active: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
    active ? "bg-[#eaf5e6] text-[#3f6a38]" : "bg-[#f1e9e2] text-[#8a766b]",
  );

const inputClass =
  "block w-full rounded-lg border border-[#d9cabd] bg-white px-3 py-2 text-sm leading-5 text-[#2d211e] outline-none transition placeholder:text-[#b3a398] focus:border-[#b8864b] focus:ring-2 focus:ring-[#b8864b]/20";

const labelClass = "block text-xs font-semibold text-[#5c4a42]";

const sectionTitle =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-[#a47845]";

const primaryButton =
  "inline-flex h-9 items-center justify-center rounded-full bg-[#2d211e] px-4 text-sm font-semibold text-white transition hover:bg-[#44332e] disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButton =
  "inline-flex h-9 items-center justify-center rounded-full border border-[#d9cabd] bg-white px-4 text-sm font-semibold text-[#5c4a42] transition hover:bg-[#f7efe8] disabled:cursor-not-allowed disabled:opacity-40";

function NoticeLine({ notice }: { notice: Notice }) {
  if (!notice) return null;

  return (
    <p
      role={notice.ok ? "status" : "alert"}
      className={cn("text-sm", notice.ok ? "text-[#456f3f]" : "text-[#b94135]")}
    >
      {notice.text}
    </p>
  );
}

/** The clinic's own value (review link, referral reward) an event depends on. */
function ClinicValueField({
  field,
  saved,
  onSave,
}: {
  field: ClinicVariableKey;
  saved: string | null;
  onSave: Save;
}) {
  const meta = CLINIC_FIELDS[field];
  const [value, setValue] = React.useState(saved ?? "");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);
  const id = React.useId();

  // Follow the saved value when it changes (set during render, not in an effect).
  const [seen, setSeen] = React.useState(saved);

  if (seen !== saved) {
    setSeen(saved);
    setValue(saved ?? "");
  }

  const save = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await onSave({ [field]: value.trim() || null });
      setNotice({ ok: true, text: "Guardado." });
    } catch (error) {
      setNotice({ ok: false, text: errorText(error, "No se pudo guardar.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#ead9bd] bg-[#fff8ec] p-4">
      <label htmlFor={id} className={labelClass}>
        {meta.label}
      </label>
      <p className="mt-1 text-xs leading-5 text-[#806d63]">{meta.help}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          type={meta.type}
          inputMode={meta.type === "url" ? "url" : undefined}
          value={value}
          maxLength={meta.max}
          placeholder={meta.placeholder}
          onChange={(event) => setValue(event.target.value)}
          className={cn(inputClass, "min-w-0 flex-1")}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy || value.trim() === (saved ?? "")}
          className={cn(secondaryButton, "shrink-0")}
        >
          {busy ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <div className="mt-1">
        <NoticeLine notice={notice} />
      </div>
    </div>
  );
}

/** Header and body inputs with chips that insert the {variables} the event offers. */
function CopyEditor({
  entry,
  draft,
  onChange,
}: {
  entry: AutomationCatalogEntry;
  draft: AutomationSetting;
  onChange: (next: AutomationSetting) => void;
}) {
  const headerRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const lastFocused = React.useRef<"header" | "body">("body");
  const unknown = [
    ...unknownVariables(draft.header, entry.variables),
    ...unknownVariables(draft.body, entry.variables),
  ];

  const insert = (variable: string) => {
    const field = lastFocused.current;
    const element = field === "header" ? headerRef.current : bodyRef.current;
    const text = draft[field];
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const token = `{${variable}}`;

    onChange({
      ...draft,
      [field]: text.slice(0, start) + token + text.slice(end),
    });
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const headerId = React.useId();
  const bodyId = React.useId();

  return (
    <div className="grid min-w-0 gap-4">
      <p className={sectionTitle}>Texto del mensaje</p>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={headerId} className={labelClass}>
            Título
          </label>
          <CharCounter text={draft.header} max={60} className="mt-0" />
        </div>
        <input
          id={headerId}
          ref={headerRef}
          value={draft.header}
          maxLength={60}
          onFocus={() => (lastFocused.current = "header")}
          onChange={(event) =>
            onChange({ ...draft, header: event.target.value })
          }
          className={cn(inputClass, "mt-1.5")}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={bodyId} className={labelClass}>
            Mensaje
          </label>
          <CharCounter text={draft.body} max={500} className="mt-0" />
        </div>
        <textarea
          id={bodyId}
          ref={bodyRef}
          value={draft.body}
          maxLength={500}
          rows={5}
          onFocus={() => (lastFocused.current = "body")}
          onChange={(event) => onChange({ ...draft, body: event.target.value })}
          className={cn(inputClass, "mt-1.5 resize-y")}
        />
      </div>
      <div className="min-w-0">
        <p className={labelClass}>Datos del cliente</p>
        <p className="mt-0.5 text-xs text-[#806d63]">
          Pulsa para insertar. Se rellena solo en cada envío.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.variables.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => insert(variable)}
              className="rounded-full border border-[#e3d2c3] bg-[#fbf3ea] px-2.5 py-1 text-xs font-semibold text-[#754b36] transition hover:border-[#b8864b] hover:bg-[#f4e5d5]"
            >
              + {VARIABLE_LABELS[variable] ?? variable}
            </button>
          ))}
        </div>
        {unknown.length > 0 ? (
          <p role="alert" className="mt-2 text-xs text-[#b94135]">
            Variable no disponible en este mensaje:{" "}
            {[...new Set(unknown)].map((name) => `{${name}}`).join(", ")}
          </p>
        ) : null}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#4a3b36]">
        <input
          type="checkbox"
          checked={draft.notify}
          onChange={(event) =>
            onChange({ ...draft, notify: event.target.checked })
          }
          className="h-4 w-4 accent-[#201715]"
        />
        Enviar como notificación push
      </label>
    </div>
  );
}

/**
 * One automatic message: its status, the clinic value it needs, an editor for the copy with a
 * live iPhone preview, and its on/off switch. Every change is saved on its own (a partial
 * update), so editing here can never overwrite what another screen set.
 */
export function AutomationCard({
  entry,
  setting,
  clinic,
  clinicName,
  expanded,
  onToggleExpand,
  onSave,
}: {
  entry: AutomationCatalogEntry;
  setting: AutomationSetting;
  clinic: NotificationSettings;
  clinicName: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onSave: Save;
}) {
  const [draft, setDraft] = React.useState(setting);
  const [busy, setBusy] = React.useState(false);
  const [confirmOff, setConfirmOff] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const [seen, setSeen] = React.useState(setting);

  if (seen !== setting) {
    setSeen(setting);
    setDraft(setting);
  }

  const dirty =
    draft.header !== setting.header ||
    draft.body !== setting.body ||
    draft.notify !== setting.notify;
  const invalid =
    !draft.header.trim() ||
    !draft.body.trim() ||
    unknownVariables(draft.header + draft.body, entry.variables).length > 0;
  const needsValue = missingClinicValue(entry, clinic);
  const values = sampleValues(clinicName, clinic);

  const run = async (patch: Partial<AutomationSetting>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await onSave({ automations: { [entry.event]: patch } });
      setNotice({ ok: true, text: success });
    } catch (error) {
      setNotice({ ok: false, text: errorText(error, "No se pudo guardar.") });
    } finally {
      setBusy(false);
      setConfirmOff(false);
    }
  };

  return (
    <div
      className={cn(
        "@container rounded-2xl border bg-white transition-shadow",
        expanded
          ? "border-[#d9c3ad] shadow-[0_8px_24px_rgba(67,42,30,0.08)]"
          : "border-[#eadfd8] hover:border-[#d9c3ad]",
      )}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-left sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-6 text-[#2d211e]">
            {entry.label}
          </span>
          <span className="mt-0.5 block text-sm leading-5 text-[#8a766b]">
            {entry.description}
          </span>
        </span>
        <span className={statusTag(setting.enabled)}>
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              setting.enabled ? "bg-[#4f9a45]" : "bg-[#b3a398]",
            )}
          />
          {setting.enabled ? "Activa" : "Inactiva"}
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "h-[18px] w-[18px] shrink-0 text-[#a47845] transition-transform duration-300",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Height animates 0fr -> 1fr, so the editor opens and closes smoothly without measuring. */}
      <div
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-5 border-t border-[#f0e6de] px-4 pb-5 pt-5 sm:px-5">
            {entry.requires ? (
              <ClinicValueField
                field={entry.requires}
                saved={clinic[entry.requires]}
                onSave={onSave}
              />
            ) : null}

            <div className="grid min-w-0 gap-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <CopyEditor entry={entry} draft={draft} onChange={setDraft} />
              <div className="grid min-w-0 content-start gap-3">
                <p className={sectionTitle}>Vista previa</p>
                <PushPreview
                  clinicName={clinicName}
                  header={renderPreview(draft.header, values)}
                  body={renderPreview(draft.body, values)}
                  silent={!draft.notify}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[#f0e6de] pt-4">
              <button
                type="button"
                onClick={() =>
                  run(
                    {
                      header: draft.header.trim(),
                      body: draft.body.trim(),
                      notify: draft.notify,
                    },
                    "Cambios guardados.",
                  )
                }
                disabled={busy || !dirty || invalid}
                className={primaryButton}
              >
                {busy ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    header: entry.defaults.header,
                    body: entry.defaults.body,
                  })
                }
                disabled={busy}
                className="inline-flex h-9 items-center px-2 text-sm font-semibold text-[#8a766b] transition hover:text-[#2d211e] disabled:opacity-40"
              >
                Restaurar texto original
              </button>
              <div className="ml-auto">
                {setting.enabled ? (
                  <button
                    type="button"
                    onClick={() => setConfirmOff(true)}
                    disabled={busy}
                    className="inline-flex h-9 items-center rounded-full border border-[#e8b9b1] bg-white px-4 text-sm font-semibold text-[#b94135] transition hover:bg-[#fff3f1] disabled:opacity-40"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      run({ enabled: true }, "Automatización activada.")
                    }
                    disabled={busy || needsValue}
                    className={secondaryButton}
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
            {!setting.enabled && needsValue && entry.requires ? (
              <p className="-mt-3 text-xs text-[#8a766b]">
                Añade {CLINIC_FIELDS[entry.requires].label.toLowerCase()} para
                poder activarla.
              </p>
            ) : null}
            <NoticeLine notice={notice} />
          </div>
        </div>
      </div>

      {confirmOff ? (
        <DeactivationDialog
          name={entry.label}
          busy={busy}
          onConfirm={() =>
            run({ enabled: false }, "Automatización desactivada.")
          }
          onCancel={() => setConfirmOff(false)}
        />
      ) : null}
    </div>
  );
}
