"use client";

import * as React from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

const automaticMessages = ["Después de una visita", "Recuperación", "Cumpleaños"];
const manualQuotaTotal = 30;
const manualQuotaRemaining = 24;
const manualQuotaLowThreshold = 5;
const manualQuotaUsedPercent = Math.round(((manualQuotaTotal - manualQuotaRemaining) / manualQuotaTotal) * 100);
const manualQuotaIsLow = manualQuotaRemaining < manualQuotaLowThreshold;

export default function CommunicationsPage() {
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [noticeTab, setNoticeTab] = React.useState<"manuales" | "automaticos">("manuales");
  const [title, setTitle] = React.useState("Tu próxima recompensa está cerca");
  const [body, setBody] = React.useState("Reserva tu próxima visita esta semana y añade puntos extra a tu pase.");
  const [audience, setAudience] = React.useState("Todos los miembros activos");
  const [sendWhen, setSendWhen] = React.useState("Ahora");
  const maxLength = 180;

  return (
    <section className="text-[#2e2421]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Comunicación con tu comunidad</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Comunicaciones</h1>
          <p className="mt-2 text-sm text-[#927e72]">Crea mensajes claros y envíalos cuando tenga sentido para tus clientes.</p>
        </div>
        <button onClick={() => setComposeOpen(true)} className="rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6d3d]"><Plus size={16} className="mr-1 inline" /> Mandar nueva comunicación</button>
      </div>

      <div className="mt-7 grid max-w-[940px] gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-[#2d211e] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">Mensajes manuales</p>
          <p className="mt-3 font-serif text-4xl font-semibold">{manualQuotaRemaining} <span className="font-sans text-sm font-normal text-[#c9b7ad]">/ {manualQuotaTotal} restantes</span></p>
          <div className="mt-3 h-1.5 rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d6a979]" style={{ width: `${manualQuotaUsedPercent}%` }} /></div>
          <p className="mt-2 text-xs text-[#c9b7ad]">Tu plan Aura · Se renueva el 1 de octubre</p>
        </div>
        <div className="rounded-3xl border border-[#e2d5cc] bg-white/75 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Estado de envíos</p>
          <p className="mt-3 font-serif text-4xl font-semibold">1.248</p>
          <p className="mt-2 text-sm text-[#927e72]">Envíos este mes</p>
        </div>
      </div>

      {manualQuotaIsLow ? (
        <div className="mt-4 flex max-w-[940px] items-start gap-3 rounded-2xl border border-[#d86d5e]/40 bg-[#fff7f5] px-4 py-3 text-sm font-semibold text-[#8f3f35] shadow-[0_14px_34px_-28px_rgba(185,65,53,0.7)]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b94135]" />
          <p>{`Alerta de cuota activa: avisaremos cuando queden ${manualQuotaLowThreshold} mensajes manuales.`}</p>
        </div>
      ) : null}

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#e2d5cc] bg-white/60 p-1 no-scrollbar">
        <button onClick={() => setNoticeTab("manuales")} className={cn("shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold", noticeTab === "manuales" ? "bg-[#2d211e] text-white" : "text-[#806d63]")}>Mensajes manuales <span className="ml-1 text-xs opacity-70">{manualQuotaRemaining} restantes</span></button>
        <button onClick={() => setNoticeTab("automaticos")} className={cn("shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold", noticeTab === "automaticos" ? "bg-[#2d211e] text-white" : "text-[#806d63]")}>Automáticos <span className="ml-1 text-xs opacity-70">8 restantes</span></button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{noticeTab === "manuales" ? "Mensaje manual" : "Mensajes automáticos"}</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">{noticeTab === "manuales" ? "Crea una comunicación" : "Automatizaciones de tu plan"}</h2>
            </div>
            <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{noticeTab === "manuales" ? `${manualQuotaRemaining} disponibles` : "8 disponibles"}</span>
          </div>

          {noticeTab === "manuales" ? (
            <>
              <label className="mt-5 block text-sm font-semibold">Título<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]" /></label>
              <label className="mt-4 block text-sm font-semibold">Cuerpo del mensaje<textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, maxLength))} rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal outline-none focus:border-[#b8864b]" /><span className="mt-1 block text-right text-xs text-[#927e72]">{body.length}/{maxLength}</span></label>
              <button onClick={() => setComposeOpen(true)} className="mt-3 rounded-full bg-[#b8864b] px-4 py-2.5 text-sm font-semibold text-white">Configurar envío</button>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              {automaticMessages.map((message) => <div key={message} className="flex items-center justify-between rounded-2xl border border-[#eadfd8] p-4"><span className="font-semibold">{message}</span><span className="h-2.5 w-2.5 rounded-full bg-[#6b9a72]" /></div>)}
            </div>
          )}
        </div>
        <Preview title={title} body={body} />
      </div>

      {composeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1513]/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="compose-title">
          <div className="grid w-full max-w-4xl gap-5 rounded-3xl bg-[#fffaf6] p-6 shadow-2xl lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Nueva comunicación</p><h2 id="compose-title" className="mt-2 font-serif text-3xl font-semibold">Editar envío</h2></div>
                <button onClick={() => setComposeOpen(false)} aria-label="Cerrar"><X /></button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Segmento<select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"><option>Todos los miembros activos</option><option>Clientes Gold</option><option>Mujeres · 25-40 · Madrid</option></select></label>
                <label className="text-sm font-semibold">Cuándo<select value={sendWhen} onChange={(event) => setSendWhen(event.target.value)} className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal"><option>Ahora</option><option>Programar para mañana</option><option>Programar fecha y hora</option></select></label>
              </div>
              <label className="mt-4 block text-sm font-semibold">Título<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} className="mt-2 w-full rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal" /></label>
              <label className="mt-4 block text-sm font-semibold">Cuerpo del mensaje<textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, maxLength))} rows={5} className="mt-2 w-full resize-none rounded-xl border border-[#ded1c8] bg-white px-3 py-3 font-normal" /><span className="mt-1 block text-right text-xs text-[#927e72]">{body.length}/{maxLength}</span></label>
              <button onClick={() => setComposeOpen(false)} className="mt-4 w-full rounded-full bg-[#b8864b] py-3 font-semibold text-white">{sendWhen === "Ahora" ? "Enviar ahora" : "Programar comunicación"}</button>
            </div>
            <Preview title={title} body={body} compact />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Preview({ title, body, compact = false }: { title: string; body: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-3xl bg-[#2d211e] p-5 text-white", !compact && "min-h-[300px]")}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">Vista previa</p>
      <div className="mt-4 rounded-2xl bg-[#f8f0ea] p-4 text-[#2e2421]">
        <p className="font-semibold">Voone Wallet</p>
        <p className="mt-3 font-semibold">{title || "Título del mensaje"}</p>
        <p className="mt-2 text-sm leading-5 text-[#806e66]">{body || "El contenido aparecerá aquí mientras escribes."}</p>
      </div>
    </div>
  );
}
