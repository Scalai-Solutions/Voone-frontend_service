"use client";

import * as React from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import {
  ApiError,
  broadcastNotification,
  getNotification,
  getNotificationSettings,
  saveNotificationSettings,
  sendSegmentNotification,
  type NotificationSettings,
  type NotificationStatus,
  type NotifyOnCredit,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

const allMembersAudience = "all";
/** The auto-created segment: members holding a bono with sessions left. */
const activeBonoAudience = "activeBono";
type Audience = typeof allMembersAudience | typeof activeBonoAudience;
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
const manualQuotaLowThreshold = 5;

export function CommunicationsPageClient() {
  const currentClinic = useCurrentClinic();
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
  const maxLength = 180;
  const manualQuotaTotal = currentClinic.data?.notificationsMonthlyQuota ?? 0;
  const manualQuotaRemaining =
    currentClinic.data?.notificationsRemainingThisMonth ?? 0;
  const manualQuotaUsedPercent =
    manualQuotaTotal > 0
      ? Math.round(
          ((manualQuotaTotal - manualQuotaRemaining) / manualQuotaTotal) * 100,
        )
      : 0;
  const manualQuotaIsLow = manualQuotaRemaining < manualQuotaLowThreshold;

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

  const saveBirthdayAutomation = async () => {
    await saveAutomationSettings("Automatización de cumpleaños guardada.", {
      birthdayEnabled,
      birthdayHeader: birthdayHeader.trim(),
      birthdayBody: birthdayBody.trim(),
      birthdayNotify,
    });
  };

  const saveVisitAutomation = async () => {
    await saveAutomationSettings("Automatización después de visita guardada.", {
      notifyOnCredit,
      marketingEnabled,
    });
  };

  const saveBonoReminderAutomation = async () => {
    await saveAutomationSettings("Automatización de bonos guardada.", {
      bonoReminderEnabled,
      bonoReminderHeader: bonoReminderHeader.trim(),
      bonoReminderBody: bonoReminderBody.trim(),
      bonoReminderNotify,
    });
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
      const response =
        audience === allMembersAudience
          ? await broadcastNotification(
              currentClinic.data.id,
              input,
              idempotencyKey,
            )
          : await sendSegmentNotification(
              currentClinic.data.id,
              { ...input, segment: { activeBono: true } },
              idempotencyKey,
            );

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
            {currentClinic.isLoading ? "..." : manualQuotaRemaining}{" "}
            <span className="font-sans text-sm font-normal text-[#c9b7ad]">
              / {manualQuotaTotal} restantes
            </span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#d6a979]"
              style={{ width: `${manualQuotaUsedPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#c9b7ad]">
            Tu plan Aura · Se renueva el 1 de octubre
          </p>
        </div>
        <div className="rounded-3xl border border-[#e2d5cc] bg-white/75 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">
            Estado de envíos
          </p>
          <p className="mt-3 font-serif text-4xl font-semibold">
            {currentClinic.isLoading
              ? "..."
              : (currentClinic.data?.notificationsUsedThisMonth ?? 0)}
          </p>
          <p className="mt-2 text-sm text-[#927e72]">Envíos reales este mes</p>
        </div>
      </div>

      {manualQuotaIsLow ? (
        <div
          className="mt-4 flex max-w-[940px] items-start gap-3 rounded-2xl border border-[#d86d5e]/40 bg-[#fff7f5] px-4 py-3 text-sm font-semibold text-[#8f3f35] shadow-[0_14px_34px_-28px_rgba(185,65,53,0.7)]"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b94135]" />
          <p>{`Alerta de cuota activa: avisaremos cuando queden ${manualQuotaLowThreshold} mensajes manuales.`}</p>
        </div>
      ) : null}

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
          Mensajes manuales{" "}
          <span className="ml-1 text-xs opacity-70">
            {manualQuotaRemaining} restantes
          </span>
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
          Automáticos <span className="ml-1 text-xs opacity-70">2 activos</span>
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
                ? `${manualQuotaRemaining} disponibles`
                : "3 automatizaciones"}
            </span>
          </div>

          {noticeTab === "manuales" ? (
            <>
              <label className="mt-5 block text-sm font-semibold">
                Header / título de Google Wallet
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Título del mensaje"
                  className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                />
                <span className="mt-1 block text-xs font-normal text-[#927e72]">
                  Se envía como{" "}
                  <span className="font-mono">message.header</span> en Google
                  Wallet.
                </span>
              </label>
              <label className="mt-4 block text-sm font-semibold">
                Body / cuerpo del mensaje
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
              <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Cumpleaños</p>
                    <p className="mt-1 text-sm leading-6 text-[#927e72]">
                      Se envía cada día a las 9:00 en España a clientes con
                      cumpleaños y pase Wallet activo.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#806d63]">
                    <input
                      type="checkbox"
                      checked={birthdayEnabled}
                      onChange={(event) =>
                        setBirthdayEnabled(event.target.checked)
                      }
                      className="h-4 w-4 accent-[#b8864b]"
                    />
                    Activo
                  </label>
                </div>

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
                <button
                  onClick={() => void saveBirthdayAutomation()}
                  disabled={
                    settingsState === "saving" ||
                    !birthdayHeader.trim() ||
                    !birthdayBody.trim()
                  }
                  className="mt-4 rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {settingsState === "saving"
                    ? "Guardando..."
                    : "Guardar cumpleaños"}
                </button>
              </div>

              <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Después de una visita</p>
                    <p className="mt-1 text-sm leading-6 text-[#927e72]">
                      Actualiza el pase cuando se registran puntos y decide
                      cuándo enviar push.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#806d63]">
                    <input
                      type="checkbox"
                      checked={marketingEnabled}
                      onChange={(event) =>
                        setMarketingEnabled(event.target.checked)
                      }
                      className="h-4 w-4 accent-[#b8864b]"
                    />
                    Marketing activo
                  </label>
                </div>
                <label className="mt-4 block text-sm font-semibold">
                  Notificación push
                  <select
                    value={notifyOnCredit}
                    onChange={(event) =>
                      setNotifyOnCredit(event.target.value as NotifyOnCredit)
                    }
                    className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]"
                  >
                    <option value="NEVER">Nunca, solo actualizar puntos</option>
                    <option value="MILESTONE_AND_TIER">
                      Solo hitos y cambios de nivel
                    </option>
                    <option value="ALWAYS">Después de cada visita</option>
                  </select>
                </label>
                <button
                  onClick={() => void saveVisitAutomation()}
                  disabled={settingsState === "saving"}
                  className="mt-4 rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {settingsState === "saving"
                    ? "Guardando..."
                    : "Guardar después de visita"}
                </button>
              </div>

              <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Recordatorio de bonos</p>
                    <p className="mt-1 text-sm leading-6 text-[#927e72]">
                      Se envía el día 1 de cada mes a clientes con un bono
                      activo y pase Wallet sincronizado.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#806d63]">
                    <input
                      type="checkbox"
                      checked={bonoReminderEnabled}
                      onChange={(event) =>
                        setBonoReminderEnabled(event.target.checked)
                      }
                      className="h-4 w-4 accent-[#b8864b]"
                    />
                    Activo
                  </label>
                </div>

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
                <button
                  onClick={() => void saveBonoReminderAutomation()}
                  disabled={
                    settingsState === "saving" ||
                    !bonoReminderHeader.trim() ||
                    !bonoReminderBody.trim()
                  }
                  className="mt-4 rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {settingsState === "saving"
                    ? "Guardando..."
                    : "Guardar recordatorio de bonos"}
                </button>
              </div>
            </div>
          )}
        </div>
        <Preview title={title} body={body} />
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
                Header / título de Google Wallet
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={60}
                  placeholder="Título del mensaje"
                  className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"
                />
                <span className="mt-1 block text-xs font-normal text-[#927e72]">
                  Se envía como{" "}
                  <span className="font-mono">message.header</span>.
                </span>
              </label>
              <label className="mt-4 block text-sm font-semibold">
                Body / cuerpo del mensaje
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
            <Preview title={title} body={body} compact />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Preview({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-[#2d211e] p-5 text-white",
        !compact && "min-h-[300px]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">
        Vista previa
      </p>
      <div className="mt-4 rounded-2xl bg-[#f8f0ea] p-4 text-[#2e2421]">
        <p className="font-semibold">Voone Wallet</p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a755f]">
          Header
        </p>
        <p className="mt-1 font-semibold">{title || "Header del mensaje"}</p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a755f]">
          Body
        </p>
        <p className="mt-2 text-sm leading-5 text-[#806e66]">
          {body || "El contenido aparecerá aquí mientras escribes."}
        </p>
      </div>
    </div>
  );
}
