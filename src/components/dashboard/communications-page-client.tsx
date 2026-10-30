"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown, Plus, X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import {
  ApiError,
  broadcastNotification,
  getAudiences,
  getNotification,
  getNotificationSettings,
  saveNotificationSettings,
  sendSegmentNotification,
  type ClinicAudience,
  type NotificationSettings,
  type NotificationStatus,
  type NotifyOnCredit,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

const allMembersAudience = "all";
/** The auto-created segment: members holding a bono with sessions left. */
const activeBonoAudience = "activeBono";
/** "all", "activeBono", or the id of a saved audience from the Audiencias tab. */
type Audience = string;
const finalNotificationStatuses = new Set<NotificationStatus>([
  "SENT",
  "PARTIAL_FAILED",
  "FAILED",
  "CANCELLED",
]);
const defaultBirthdayHeader = "¡Feliz cumpleaños!";
const defaultBirthdayBody =
  "¡Feliz cumpleaños! Disfruta de un 10% de descuento en nuestros servicios. Esperamos verte pronto.";
const defaultBonoReminderHeader = "Tienes sesiones pendientes";
const defaultBonoReminderBody =
  "Te quedan sesiones de tu bono. Reserva tu próxima cita cuando quieras.";
/**
 * The automatic communications a centre has — exactly the ones onboarding establishes, because the
 * wizard's messages step saves the same notification settings this panel reads. Listed in a
 * dropdown so the panel stays short.
 */
const automationOptions = [
  { key: "birthday", label: "Cumpleaños" },
  { key: "visit", label: "Después de una visita" },
  { key: "bono", label: "Recordatorio de bonos" },
] as const;

type AutomationKey = (typeof automationOptions)[number]["key"];

/** An automation's status tag: green while it goes out, muted while it does not. */
const statusTagClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
    active
      ? "border border-[#86b37e]/40 bg-[#f3fbf1] text-[#456f3f]"
      : "border border-[#e0cfc2] bg-[#f4e9df] text-[#927e72]",
  );

/** The automation's own name, as the deactivation dialog addresses it. */
const automationLabel = (key: AutomationKey) =>
  automationOptions.find((option) => option.key === key)?.label ??
  "la automatización";

/**
 * One automation in the list. The collapsed row carries its name, what it does and its status
 * tag, so the whole list reads without opening anything; the header (chevron included) toggles
 * its details open.
 */
function AutomationCard({
  title,
  description,
  active,
  expanded,
  onToggleExpand,
  children,
}: {
  title: string;
  description: string;
  active: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
        >
          <ChevronDown
            size={16}
            aria-hidden
            className={cn(
              "mt-1 h-4 w-4 shrink-0 text-[#b8864b] transition-transform",
              expanded && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className="block font-semibold">{title}</span>
            <span className="mt-1 block text-sm leading-6 text-[#927e72]">
              {description}
            </span>
          </span>
        </button>
        <span className={statusTagClass(active)}>
          {active ? "Activa" : "Inactiva"}
        </span>
      </div>
      {expanded ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

/**
 * The dedicated switch of one automation, in its expanded details next to the save button:
 * Desactivar opens the confirmation dialog first; Activar acts on the click, because nothing
 * stops going out because of a reactivation.
 */
function AutomationOnOffButton({
  active,
  busy,
  onTurnOff,
  onTurnOn,
}: {
  active: boolean;
  busy: boolean;
  onTurnOff: () => void;
  onTurnOn: () => void;
}) {
  return active ? (
    <button
      type="button"
      onClick={onTurnOff}
      disabled={busy}
      className="rounded-full border border-[#d86d5e]/50 bg-[#fff7f5] px-4 py-2.5 text-sm font-semibold text-[#b94135] disabled:cursor-not-allowed disabled:opacity-60"
    >
      Desactivar automatización
    </button>
  ) : (
    <button
      type="button"
      onClick={onTurnOn}
      disabled={busy}
      className="rounded-full bg-[#2d211e] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      Activar automatización
    </button>
  );
}

/**
 * The confirmation before an automation stops going out: a switch-off must be deliberate, so
 * the dedicated Desactivar button opens this dialog instead of acting on the click.
 */
function DeactivationDialog({
  name,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d211e]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivation-dialog-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#b94135] text-white">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3
              id="deactivation-dialog-title"
              className="font-serif text-2xl font-semibold"
            >
              ¿Desactivar «{name}»?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#806d63]">
              ¿Seguro que quieres desactivarla? Tus clientes dejarán de
              recibir esta comunicación automática.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-[#b94135] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Desactivando..." : "Sí, desactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunicationsPageClient() {
  const currentClinic = useCurrentClinic();
  // The centre's saved audiences (Audiencias): what the Segmento dropdown offers beyond the
  // two automatic options, and what a send targets through its own criteria.
  const audiencesQuery = useQuery({
    queryKey: ["audiences", currentClinic.data?.id],
    enabled: Boolean(currentClinic.data?.id),
    queryFn: () => getAudiences(currentClinic.data?.id ?? ""),
  });
  const savedAudiences = audiencesQuery.data ?? [];
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [noticeTab, setNoticeTab] = React.useState<"manuales" | "automaticos">(
    "manuales",
  );
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState<Audience>(allMembersAudience);
  const [sendWhen, setSendWhen] = React.useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [sendState, setSendState] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [sendMessage, setSendMessage] = React.useState<string | null>(null);
  const [, setSettings] = React.useState<NotificationSettings | null>(null);
  const [settingsState, setSettingsState] = React.useState<
    "idle" | "loading" | "saving" | "saved" | "error"
  >("idle");
  const [settingsMessage, setSettingsMessage] = React.useState<string | null>(
    null,
  );
  const [birthdayHeader, setBirthdayHeader] = React.useState(
    defaultBirthdayHeader,
  );
  const [birthdayBody, setBirthdayBody] = React.useState(defaultBirthdayBody);
  const [birthdayEnabled, setBirthdayEnabled] = React.useState(true);
  const [birthdayNotify, setBirthdayNotify] = React.useState(true);
  const [bonoReminderHeader, setBonoReminderHeader] = React.useState(
    defaultBonoReminderHeader,
  );
  const [bonoReminderBody, setBonoReminderBody] = React.useState(
    defaultBonoReminderBody,
  );
  const [bonoReminderEnabled, setBonoReminderEnabled] = React.useState(true);
  const [bonoReminderNotify, setBonoReminderNotify] = React.useState(true);
  const [notifyOnCredit, setNotifyOnCredit] =
    React.useState<NotifyOnCredit>("MILESTONE_AND_TIER");
  const [marketingEnabled, setMarketingEnabled] = React.useState(true);
  /** Which automation's details are expanded; null collapses the whole list. */
  const [expandedAutomation, setExpandedAutomation] =
    React.useState<AutomationKey | null>("birthday");
  /** The automation waiting on the deactivation dialog before it is saved off. */
  const [pendingOff, setPendingOff] = React.useState<AutomationKey | null>(
    null,
  );
  /** Whether a turn on/off is being saved; the automation switches wait while one is. */
  const [togglingAutomation, setTogglingAutomation] = React.useState(false);
  const maxLength = 180;
  // No message quota is shown anywhere: the plan does not limit how many messages a centre
  // sends, only how many it has actually sent this month.
  const manualSentThisMonth = currentClinic.data?.notificationsUsedThisMonth ?? 0;
  // Whether each automation really goes out: its own switch (birthday, bonos) or the push
  // decision (visits). These drive the tag on every list row and the counts above them.
  const birthdayAutomationActive = birthdayEnabled;
  const visitAutomationActive = notifyOnCredit !== "NEVER";
  const bonoAutomationActive = bonoReminderEnabled;
  const activeAutomationsCount = [
    birthdayAutomationActive,
    visitAutomationActive,
    bonoAutomationActive,
  ].filter(Boolean).length;

  React.useEffect(() => {
    if (!currentClinic.data) return;

    let cancelled = false;

    void getNotificationSettings(currentClinic.data.id)
      .then((value) => {
        if (cancelled) return;
        setSettings(value);
        setBirthdayHeader(value.birthdayHeader || defaultBirthdayHeader);
        setBirthdayBody(value.birthdayBody || defaultBirthdayBody);
        setBirthdayEnabled(value.birthdayEnabled);
        setBirthdayNotify(value.birthdayNotify);
        setBonoReminderHeader(
          value.bonoReminderHeader || defaultBonoReminderHeader,
        );
        setBonoReminderBody(value.bonoReminderBody || defaultBonoReminderBody);
        setBonoReminderEnabled(value.bonoReminderEnabled);
        setBonoReminderNotify(value.bonoReminderNotify);
        setNotifyOnCredit(value.notifyOnCredit);
        setMarketingEnabled(value.marketingEnabled);
        setSettingsState("idle");
      })
      .catch((error) => {
        if (cancelled) return;
        setSettingsState("error");
        setSettingsMessage(
          error instanceof ApiError && error.detail
            ? error.detail
            : "No se pudieron cargar las automatizaciones.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [currentClinic.data]);

  const selectedSchedule = () => {
    if (sendWhen === "now") return undefined;

    const date = new Date(scheduledAt);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const waitForFinalStatus = async (notificationId: string) => {
    for (let attempt = 0; attempt < 15; attempt += 1) {
      const status = await getNotification(notificationId);

      if (finalNotificationStatuses.has(status.notification.status)) {
        return status.notification.status;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return "QUEUED" as NotificationStatus;
  };

  const saveAutomationSettings = async (
    message: string,
    patch: Partial<NotificationSettings>,
  ) => {
    if (!currentClinic.data) {
      setSettingsState("error");
      setSettingsMessage("No se pudo resolver la clínica actual.");
      return;
    }

    const next: NotificationSettings = {
      notifyOnCredit,
      marketingEnabled,
      birthdayEnabled,
      birthdayHeader: birthdayHeader.trim(),
      birthdayBody: birthdayBody.trim(),
      birthdayNotify,
      bonoReminderEnabled,
      bonoReminderHeader: bonoReminderHeader.trim(),
      bonoReminderBody: bonoReminderBody.trim(),
      bonoReminderNotify,
      ...patch,
    };

    setSettingsState("saving");
    setSettingsMessage(null);

    try {
      const saved = await saveNotificationSettings(currentClinic.data.id, next);

      setSettings(saved);
      setNotifyOnCredit(saved.notifyOnCredit);
      setMarketingEnabled(saved.marketingEnabled);
      setBirthdayEnabled(saved.birthdayEnabled);
      setBirthdayHeader(saved.birthdayHeader || defaultBirthdayHeader);
      setBirthdayBody(saved.birthdayBody || defaultBirthdayBody);
      setBirthdayNotify(saved.birthdayNotify);
      setBonoReminderHeader(
        saved.bonoReminderHeader || defaultBonoReminderHeader,
      );
      setBonoReminderBody(saved.bonoReminderBody || defaultBonoReminderBody);
      setBonoReminderEnabled(saved.bonoReminderEnabled);
      setBonoReminderNotify(saved.bonoReminderNotify);
      setSettingsState("saved");
      setSettingsMessage(message);
    } catch (error) {
      setSettingsState("error");
      setSettingsMessage(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se pudieron guardar las automatizaciones.",
      );
    }
  };

  /**
   * Saves the birthday automation. `nextEnabled` is the dedicated Desactivar/Activar button,
   * which saves straight away rather than flipping a checkbox that still needed Guardar.
   */
  const saveBirthdayAutomation = async (nextEnabled?: boolean) => {
    await saveAutomationSettings("Automatización de cumpleaños guardada.", {
      birthdayEnabled: nextEnabled ?? birthdayEnabled,
      birthdayHeader: birthdayHeader.trim(),
      birthdayBody: birthdayBody.trim(),
      birthdayNotify,
    });
  };

  /** Same, for the after-visit automation: `nextNotify` is NEVER to switch off, or the on default. */
  const saveVisitAutomation = async (nextNotify?: NotifyOnCredit) => {
    await saveAutomationSettings("Automatización después de visita guardada.", {
      notifyOnCredit: nextNotify ?? notifyOnCredit,
      marketingEnabled,
    });
  };

  /** Same, for the monthly bono reminder. */
  const saveBonoReminderAutomation = async (nextEnabled?: boolean) => {
    await saveAutomationSettings("Automatización de bonos guardada.", {
      bonoReminderEnabled: nextEnabled ?? bonoReminderEnabled,
      bonoReminderHeader: bonoReminderHeader.trim(),
      bonoReminderBody: bonoReminderBody.trim(),
      bonoReminderNotify,
    });
  };

  /** Turns an automation back on. No confirmation: nothing stops going out because of it. */
  const turnAutomationOn = async (key: AutomationKey) => {
    if (settingsState === "saving" || togglingAutomation) return;

    setTogglingAutomation(true);
    try {
      if (key === "birthday") await saveBirthdayAutomation(true);
      if (key === "visit") await saveVisitAutomation("MILESTONE_AND_TIER");
      if (key === "bono") await saveBonoReminderAutomation(true);
    } finally {
      setTogglingAutomation(false);
    }
  };

  /**
   * The dialog's Sí, desactivar: the automation is saved off, the confirmation already made.
   * The birthday one switches off its own flag, the visit one falls to NEVER, the bono one its
   * own — the same three switches the tags read.
   */
  const confirmTurnOff = async () => {
    if (settingsState === "saving" || togglingAutomation) return;

    const key = pendingOff;
    if (!key) return;

    setTogglingAutomation(true);
    try {
      if (key === "birthday") await saveBirthdayAutomation(false);
      if (key === "visit") await saveVisitAutomation("NEVER");
      if (key === "bono") await saveBonoReminderAutomation(false);
    } finally {
      setTogglingAutomation(false);
      setPendingOff(null);
    }
  };

  const sendCommunication = async () => {
    if (!currentClinic.data) {
      setSendState("error");
      setSendMessage("No se pudo resolver la clínica actual.");
      return;
    }

    const scheduledDate = selectedSchedule();

    if (scheduledDate === null) {
      setSendState("error");
      setSendMessage(
        "Elige una fecha y hora válidas para programar la comunicación.",
      );
      return;
    }

    setSendState("sending");
    setSendMessage(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const input = {
        header: title.trim(),
        body: body.trim(),
        notify: true,
        ...(scheduledDate ? { scheduledAt: scheduledDate.toISOString() } : {}),
      };
      // A saved audience sends through its own criteria; the two automatic options are fixed.
      // One that vanished meanwhile (deleted from Audiencias elsewhere) is caught here rather
      // than silently sent to nobody.
      let response: Awaited<ReturnType<typeof broadcastNotification>>;

      if (audience === allMembersAudience) {
        response = await broadcastNotification(
          currentClinic.data.id,
          input,
          idempotencyKey,
        );
      } else {
        const criteria =
          audience === activeBonoAudience
            ? { activeBono: true }
            : savedAudiences.find((row) => row.id === audience)?.criteria;

        if (!criteria) {
          throw new Error("Ese segmento ya no existe. Elige otro y vuelve a enviar.");
        }

        response = await sendSegmentNotification(
          currentClinic.data.id,
          { ...input, segment: criteria },
          idempotencyKey,
        );
      }

      if (scheduledDate) {
        setSendState("sent");
        setSendMessage(
          `Comunicación programada para ${scheduledDate.toLocaleString("es-ES")}.`,
        );
        setComposeOpen(false);
        void currentClinic.refetch();
        return;
      }

      const finalStatus = await waitForFinalStatus(response.notificationId);

      setSendState(
        finalStatus === "FAILED" || finalStatus === "CANCELLED"
          ? "error"
          : "sent",
      );
      setSendMessage(
        finalStatus === "QUEUED" || finalStatus === "PROCESSING"
          ? "Comunicación guardada y pendiente de entrega."
          : `Comunicación finalizada. Estado: ${finalStatus}.`,
      );
      setComposeOpen(false);
      void currentClinic.refetch();
    } catch (error) {
      setSendState("error");
      setSendMessage(
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se pudo enviar la comunicación.",
      );
    }
  };

  return (
    <section className="text-[#2e2421]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">
            Comunicación con tu comunidad
          </p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">
            Comunicaciones
          </h1>
          <p className="mt-2 text-sm text-[#927e72]">
            Crea mensajes claros y envíalos cuando tenga sentido para tus
            clientes.
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6d3d]"
        >
          <Plus size={16} className="mr-1 inline" /> Mandar nueva comunicación
        </button>
      </div>

      <div className="mt-7 grid max-w-[940px] gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-[#2d211e] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">
            Mensajes manuales
          </p>
          <p className="mt-3 font-serif text-4xl font-semibold">
            {currentClinic.isLoading ? "..." : manualSentThisMonth}
          </p>
          <p className="mt-2 text-xs text-[#c9b7ad]">
            Enviados este mes · tu plan no limita los envíos
          </p>
        </div>
        <div className="rounded-3xl border border-[#e2d5cc] bg-white/75 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">
            Automatizaciones activas
          </p>
          <p className="mt-3 font-serif text-4xl font-semibold">
            {currentClinic.isLoading ? "..." : activeAutomationsCount}
            <span className="font-sans text-sm font-normal text-[#927e72]">
              {" "}
              de {automationOptions.length}
            </span>
          </p>
          <p className="mt-2 text-sm text-[#927e72]">
            Las mismas que guardaste durante el alta
          </p>
        </div>
      </div>

      {sendMessage ? (
        <div
          className={cn(
            "mt-4 max-w-[940px] rounded-2xl px-4 py-3 text-sm font-semibold",
            sendState === "error"
              ? "border border-[#d86d5e]/40 bg-[#fff7f5] text-[#8f3f35]"
              : "border border-[#86b37e]/40 bg-[#f3fbf1] text-[#456f3f]",
          )}
          role="status"
        >
          {sendMessage}
        </div>
      ) : null}

      {settingsMessage ? (
        <div
          className={cn(
            "mt-4 max-w-[940px] rounded-2xl px-4 py-3 text-sm font-semibold",
            settingsState === "error"
              ? "border border-[#d86d5e]/40 bg-[#fff7f5] text-[#8f3f35]"
              : "border border-[#86b37e]/40 bg-[#f3fbf1] text-[#456f3f]",
          )}
          role="status"
        >
          {settingsMessage}
        </div>
      ) : null}

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#e2d5cc] bg-white/60 p-1 no-scrollbar">
        <button
          onClick={() => setNoticeTab("manuales")}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
            noticeTab === "manuales"
              ? "bg-[#2d211e] text-white"
              : "text-[#806d63]",
          )}
        >
          Mensajes manuales
        </button>
        <button
          onClick={() => setNoticeTab("automaticos")}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold",
            noticeTab === "automaticos"
              ? "bg-[#2d211e] text-white"
              : "text-[#806d63]",
          )}
        >
          Automáticos{" "}
          <span className="ml-1 text-xs opacity-70">
            {activeAutomationsCount} activas
          </span>
        </button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">
                {noticeTab === "manuales"
                  ? "Mensaje manual"
                  : "Mensajes automáticos"}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">
                {noticeTab === "manuales"
                  ? "Crea una comunicación"
                  : "Automatizaciones de tu plan"}
              </h2>
            </div>
            <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
              {noticeTab === "manuales"
                ? "Sin límite de envíos"
                : `${automationOptions.length} automatizaciones`}
            </span>
          </div>

          {noticeTab === "manuales" ? (
            <>
              <label className="mt-5 block text-sm font-semibold">
                Título del mensaje
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Título del mensaje"
                  className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                />
                <span className="mt-1 block text-xs font-normal text-[#927e72]">
                  Se muestra como título en Google Wallet y como primera parte
                  del aviso en Apple Wallet.
                </span>
              </label>
              <label className="mt-4 block text-sm font-semibold">
                Texto del mensaje
                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(event.target.value.slice(0, maxLength))
                  }
                  rows={4}
                  placeholder="Escribe el contenido del mensaje"
                  className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                />
                <span className="mt-1 block text-right text-xs text-[#927e72]">
                  {body.length}/{maxLength}
                </span>
              </label>
              <button
                onClick={() => setComposeOpen(true)}
                className="mt-3 rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Configurar envío
              </button>
            </>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-[#927e72]">
                Las mismas automatizaciones que guardaste durante el alta:
                ábrelas para editarlas, o desactívalas.
              </p>

              <AutomationCard
                title="Cumpleaños"
                description="Se envía cada día a las 9:00 en España a clientes con cumpleaños y pase Wallet activo."
                active={birthdayAutomationActive}
                expanded={expandedAutomation === "birthday"}
                onToggleExpand={() =>
                  setExpandedAutomation((current) =>
                    current === "birthday" ? null : "birthday",
                  )
                }
              >

                <label className="mt-4 block text-sm font-semibold">
                  Título
                  <input
                    value={birthdayHeader}
                    onChange={(event) =>
                      setBirthdayHeader(event.target.value.slice(0, 60))
                    }
                    maxLength={60}
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  />
                </label>
                <label className="mt-4 block text-sm font-semibold">
                  Mensaje de cumpleaños
                  <textarea
                    value={birthdayBody}
                    onChange={(event) =>
                      setBirthdayBody(event.target.value.slice(0, 500))
                    }
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  />
                  <span className="mt-1 block text-right text-xs text-[#927e72]">
                    {birthdayBody.length}/500
                  </span>
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#806d63]">
                  <input
                    type="checkbox"
                    checked={birthdayNotify}
                    onChange={(event) =>
                      setBirthdayNotify(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#b8864b]"
                  />
                  Enviar como notificación push si el Wallet lo permite
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => void saveBirthdayAutomation()}
                    disabled={
                      settingsState === "saving" ||
                      !birthdayHeader.trim() ||
                      !birthdayBody.trim()
                    }
                    className="rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {settingsState === "saving"
                      ? "Guardando..."
                      : "Guardar cumpleaños"}
                  </button>
                  <AutomationOnOffButton
                    active={birthdayAutomationActive}
                    busy={settingsState === "saving" || togglingAutomation}
                    onTurnOff={() => setPendingOff("birthday")}
                    onTurnOn={() => void turnAutomationOn("birthday")}
                  />
                </div>
              </AutomationCard>

              <AutomationCard
                title="Después de una visita"
                description="Actualiza el pase cuando se registran puntos y decide cuándo enviar push."
                active={visitAutomationActive}
                expanded={expandedAutomation === "visit"}
                onToggleExpand={() =>
                  setExpandedAutomation((current) =>
                    current === "visit" ? null : "visit",
                  )
                }
              >
                <label className="flex items-center gap-2 text-xs font-semibold text-[#806d63]">
                  <input
                    type="checkbox"
                    checked={marketingEnabled}
                    onChange={(event) =>
                      setMarketingEnabled(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#b8864b]"
                  />
                  Marketing activo (también abre o cierra los mensajes
                  manuales)
                </label>
                <label className="mt-4 block text-sm font-semibold">
                  Notificación push
                  <select
                    value={notifyOnCredit}
                    onChange={(event) => {
                      const next = event.target.value as NotifyOnCredit;

                      // Choosing "Nunca" is the same turn-off as the dedicated button, so it
                      // opens the confirmation dialog too.
                      if (next === "NEVER" && visitAutomationActive) {
                        setPendingOff("visit");
                        return;
                      }

                      setNotifyOnCredit(next);
                    }}
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  >
                    <option value="NEVER">Nunca, solo actualizar puntos</option>
                    <option value="MILESTONE_AND_TIER">
                      Solo hitos y cambios de nivel
                    </option>
                    <option value="ALWAYS">Después de cada visita</option>
                  </select>
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => void saveVisitAutomation()}
                    disabled={settingsState === "saving"}
                    className="rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {settingsState === "saving"
                      ? "Guardando..."
                      : "Guardar después de visita"}
                  </button>
                  <AutomationOnOffButton
                    active={visitAutomationActive}
                    busy={settingsState === "saving" || togglingAutomation}
                    onTurnOff={() => setPendingOff("visit")}
                    onTurnOn={() => void turnAutomationOn("visit")}
                  />
                </div>
              </AutomationCard>

              <AutomationCard
                title="Recordatorio de bonos"
                description="Se envía el día 1 de cada mes a clientes con un bono activo y pase Wallet sincronizado."
                active={bonoAutomationActive}
                expanded={expandedAutomation === "bono"}
                onToggleExpand={() =>
                  setExpandedAutomation((current) =>
                    current === "bono" ? null : "bono",
                  )
                }
              >

                <label className="mt-4 block text-sm font-semibold">
                  Título
                  <input
                    value={bonoReminderHeader}
                    onChange={(event) =>
                      setBonoReminderHeader(event.target.value.slice(0, 60))
                    }
                    maxLength={60}
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  />
                </label>
                <label className="mt-4 block text-sm font-semibold">
                  Mensaje de recordatorio
                  <textarea
                    value={bonoReminderBody}
                    onChange={(event) =>
                      setBonoReminderBody(event.target.value.slice(0, 500))
                    }
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  />
                  <span className="mt-1 block text-right text-xs text-[#927e72]">
                    {bonoReminderBody.length}/500
                  </span>
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#806d63]">
                  <input
                    type="checkbox"
                    checked={bonoReminderNotify}
                    onChange={(event) =>
                      setBonoReminderNotify(event.target.checked)
                    }
                    className="h-4 w-4 accent-[#b8864b]"
                  />
                  Enviar como notificación push si el Wallet lo permite
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => void saveBonoReminderAutomation()}
                    disabled={
                      settingsState === "saving" ||
                      !bonoReminderHeader.trim() ||
                      !bonoReminderBody.trim()
                    }
                    className="rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {settingsState === "saving"
                      ? "Guardando..."
                      : "Guardar recordatorio de bonos"}
                  </button>
                  <AutomationOnOffButton
                    active={bonoAutomationActive}
                    busy={settingsState === "saving" || togglingAutomation}
                    onTurnOff={() => setPendingOff("bono")}
                    onTurnOn={() => void turnAutomationOn("bono")}
                  />
                </div>
              </AutomationCard>
            </div>
          )}
        </div>
        <Preview
          title={title}
          body={body}
          clinicName={currentClinic.data?.name}
        />
      </div>

      {composeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1d1513]/70 p-5 pt-[128px] backdrop-blur-sm md:pt-[144px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-title"
        >
          <div className="grid w-full max-w-4xl gap-5 rounded-3xl bg-[#fffaf6] p-6 shadow-2xl lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">
                    Nueva comunicación
                  </p>
                  <h2
                    id="compose-title"
                    className="mt-2 font-serif text-3xl font-semibold"
                  >
                    Editar envío
                  </h2>
                </div>
                <button
                  onClick={() => setComposeOpen(false)}
                  aria-label="Cerrar"
                >
                  <X />
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Segmento
                  <select
                    value={audience}
                    onChange={(event) =>
                      setAudience(event.target.value as Audience)
                    }
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white py-3 pl-3 pr-10 font-normal"
                  >
                    <option value={allMembersAudience}>
                      Todos los miembros activos
                    </option>
                    <option value={activeBonoAudience}>
                      Miembros con bono activo
                    </option>
                    {savedAudiences.map((saved) => (
                      <option key={saved.id} value={saved.id}>
                        {saved.name} · {saved.memberCount} personas
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Cuándo
                  <select
                    value={sendWhen}
                    onChange={(event) =>
                      setSendWhen(event.target.value as "now" | "scheduled")
                    }
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white py-3 pl-3 pr-10 font-normal"
                  >
                    <option value="now">Ahora</option>
                    <option value="scheduled">Programar fecha y hora</option>
                  </select>
                </label>
              </div>
              {sendWhen === "scheduled" ? (
                <label className="mt-4 block text-sm font-semibold">
                  Fecha y hora de envío
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"
                  />
                </label>
              ) : null}
              <label className="mt-4 block text-sm font-semibold">
                Título del mensaje
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Título del mensaje"
                  className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"
                />
                <span className="mt-1 block text-xs font-normal text-[#927e72]">
                  Se muestra como título en Google Wallet y como primera parte
                  del aviso en Apple Wallet.
                </span>
              </label>
              <label className="mt-4 block text-sm font-semibold">
                Texto del mensaje
                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(event.target.value.slice(0, maxLength))
                  }
                  rows={5}
                  placeholder="Escribe el contenido del mensaje"
                  className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"
                />
                <span className="mt-1 block text-right text-xs text-[#927e72]">
                  {body.length}/{maxLength}
                </span>
              </label>
              <button
                onClick={() => void sendCommunication()}
                disabled={
                  sendState === "sending" ||
                  !title.trim() ||
                  !body.trim() ||
                  (sendWhen === "scheduled" && !scheduledAt)
                }
                className="mt-4 w-full rounded-full bg-[#b8864b] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendState === "sending"
                  ? "Enviando..."
                  : sendWhen === "now"
                    ? "Enviar ahora"
                    : "Programar comunicación"}
              </button>
            </div>
            <Preview
              title={title}
              body={body}
              clinicName={currentClinic.data?.name}
              compact
            />
          </div>
        </div>
      ) : null}

      {pendingOff ? (
        <DeactivationDialog
          name={automationLabel(pendingOff)}
          busy={settingsState === "saving" || togglingAutomation}
          onConfirm={() => void confirmTurnOff()}
          onCancel={() => setPendingOff(null)}
        />
      ) : null}
    </section>
  );
}

const noopSubscribe = () => () => {};

/** Same abbreviations the backend uses for the Apple card line. */
const spanishMonthAbbreviations = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
];
const madridDayMonthFormat = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  day: "numeric",
  month: "numeric",
});

/** Today in Europe/Madrid as "d MMM" (e.g. "27 oct", "5 sept"). */
function formatMadridDayMonth(date: Date) {
  const parts = madridDayMonthFormat.formatToParts(date);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return `${day} ${spanishMonthAbbreviations[month - 1]}`;
}

/** Today's label; "hoy" while server-rendering. */
function useTodayLabel() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => formatMadridDayMonth(new Date()),
    () => "hoy",
  );
}

function Preview({
  title,
  body,
  clinicName,
  compact = false,
}: {
  title: string;
  body: string;
  clinicName?: string;
  compact?: boolean;
}) {
  const today = useTodayLabel();
  const shownTitle = title.trim() || "Título del mensaje";
  const shownBody =
    body.trim() || "El contenido aparecerá aquí mientras escribes.";

  return (
    <div
      role="group"
      aria-label="Vista previa del mensaje"
      className={cn(
        "min-w-0 rounded-3xl bg-[#2d211e] p-5 text-white",
        !compact && "min-h-[300px]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">
        Vista previa
      </p>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9b7ad]">
        Google Wallet
      </p>
      <div
        aria-hidden="true"
        className="mt-2 rounded-2xl bg-[#f8f0ea] p-4 text-[#2e2421]"
      >
        <p className="break-words font-semibold">{shownTitle}</p>
        <p className="mt-2 break-words text-sm leading-5 text-[#806e66]">
          {shownBody}
        </p>
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9b7ad]">
        Apple Wallet
      </p>
      <div
        aria-hidden="true"
        className="mt-2 rounded-2xl bg-white/15 p-3 text-white backdrop-blur"
      >
        <div className="flex items-center justify-between gap-2 text-[11px] text-white/70">
          <span className="min-w-0 truncate font-semibold uppercase tracking-[0.08em]">
            {clinicName || "Tu centro"}
          </span>
          <span className="shrink-0">ahora</span>
        </div>
        <p className="mt-1 truncate text-sm leading-5">
          {today} · {shownTitle}: {shownBody}
        </p>
      </div>
      <p className="mt-2 text-xs text-[#c9b7ad]">
        Apple muestra una sola línea de texto.
      </p>
    </div>
  );
}
