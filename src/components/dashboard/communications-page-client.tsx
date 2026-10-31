"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { AutomationsPanel } from "@/features/notifications/components/automations-panel";
import { staffSettingsApi } from "@/features/notifications/settings-api";
import { useNotificationSettings } from "@/features/notifications/use-notification-settings";
import {
  ApiError,
  broadcastNotification,
  getAudiences,
  getNotification,
  sendSegmentNotification,
  type ClinicAudience,
  type NotificationStatus,
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
  const maxLength = 180;
  // No message quota is shown anywhere: the plan does not limit how many messages a centre
  // sends, only how many it has actually sent this month.
  const manualSentThisMonth =
    currentClinic.data?.notificationsUsedThisMonth ?? 0;
  // The same settings the panel edits (one cache entry), for the count on the tab.
  const settingsApi = React.useMemo(
    () => staffSettingsApi(currentClinic.data?.id ?? ""),
    [currentClinic.data?.id],
  );
  const automationSettings = useNotificationSettings(settingsApi, {
    enabled: Boolean(currentClinic.data?.id),
  }).settings.data;
  const activeAutomationsCount = automationSettings
    ? Object.values(automationSettings.automations).filter((a) => a.enabled)
        .length
    : null;

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
          throw new Error(
            "Ese segmento ya no existe. Elige otro y vuelve a enviar.",
          );
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
            {activeAutomationsCount ?? "..."}
            <span className="font-sans text-sm font-normal text-[#927e72]">
              {" "}
              de{" "}
              {automationSettings
                ? Object.keys(automationSettings.automations).length
                : "…"}
            </span>
          </p>
          <p className="mt-2 text-sm text-[#927e72]">
            Las mismas que configuraste durante el alta
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
            {activeAutomationsCount ?? "…"} activas
          </span>
        </button>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
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
                : "Se envían solas"}
            </span>
          </div>

          <div
            key={noticeTab}
            className="content-in"
          >
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
            ) : currentClinic.data ? (
              <div className="mt-5">
                <p className="mb-4 text-sm leading-6 text-[#927e72]">
                  Mensajes que se envían solos. Edita el texto, añade datos del
                  cliente con los botones y comprueba cómo se verá en el iPhone
                  antes de guardar.
                </p>
                <AutomationsPanel
                  api={settingsApi}
                  clinicName={currentClinic.data.name}
                />
              </div>
            ) : null}
          </div>
        </div>
        {/* The preview slides away on the automatic tab so the panel can take the full width. */}
        <div
          inert={noticeTab !== "manuales"}
          aria-hidden={noticeTab !== "manuales"}
          className={cn(
            "overflow-hidden transition-[max-height,width,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:max-h-none lg:shrink-0",
            noticeTab === "manuales"
              ? "max-h-[1400px] opacity-100 lg:w-[380px]"
              : "max-h-0 opacity-0 lg:w-0",
          )}
        >
          <div className="pt-5 lg:w-[380px] lg:pl-5 lg:pt-0">
            <Preview
              title={title}
              body={body}
              clinicName={currentClinic.data?.name}
            />
          </div>
        </div>
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
