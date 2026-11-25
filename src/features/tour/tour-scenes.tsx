"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Copy, Gift, Info, Plus, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { findCampaign, type CampaignAudience } from "./tour-campaigns";
import { TOUR_UI } from "./tour-copy";
import { TourText } from "./tour-text";
import type { CampaignId, TourSceneId, VisitFocus } from "./tour-types";

/**
 * Small illustrations drawn inside a bubble, for screens the tour can't visit: the public sign-up
 * form, the visit panel (it only exists after a scan) and the send dialog. Labels match the real
 * screens so people recognise them later. Decorative, except the campaign "Copiar" buttons.
 */
export function TourScene({ id }: { id: TourSceneId }) {
  if (id === "welcome-emblem") return <WelcomeEmblem />;
  if (id === "signup-referral") return <SignupFormMock focus="referral" />;
  if (id === "signup-consent") return <SignupFormMock focus="consent" />;
  if (id === "card-recovery") return <CardRecoveryMock />;
  if (id === "send-setup") return <SendSetupMock />;
  if (id.startsWith("visit-")) return <VisitPanelMock focus={id.slice("visit-".length) as VisitFocus} />;

  return <CampaignScene id={id.slice("campaign-".length) as CampaignId} />;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Props for a block that rises into place, staggered by `delay`. */
function useRise() {
  const reduce = useReducedMotion();

  return (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.35, ease: EASE } };
}

/** A part of a mock: the one the step is about gets a gold ring, the rest step back. */
function Part({ active, delay = 0, className, children }: { active: boolean; delay?: number; className?: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("rounded-xl", active && "ring-2 ring-[#e5bd80] ring-offset-2 ring-offset-[#f6f1ed]", className)}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: active ? 1 : 0.42, y: 0 }}
      transition={reduce ? { duration: 0 } : { delay, duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function MockFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 rounded-2xl border border-[#e2d5cc] bg-[#f6f1ed] p-3", className)} aria-hidden>
      {children}
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-[#806d63]">{label}</p>
      <p className="mt-1 truncate rounded-lg border border-[#ded1c8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2e2421]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] leading-4 text-[#927e72]">{hint}</p> : null}
    </div>
  );
}

function Checkbox({ checked, label, tag }: { checked: boolean; label: string; tag: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border",
          checked ? "border-[#2d211e] bg-[#2d211e] text-white" : "border-[#c9b7ad] bg-white",
        )}
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </span>
      <p className="min-w-0 flex-1 text-[11px] leading-4 text-[#493832]">{label}</p>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]",
          checked ? "bg-[#2d211e] text-white" : "bg-[#e9f3e8] text-[#3d6a48]",
        )}
      >
        {tag}
      </span>
    </div>
  );
}

function WelcomeEmblem() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto mb-4 grid h-24 w-24 place-items-center" aria-hidden>
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-[#e5bd80]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={reduce ? { scale: 1, opacity: 0.35 } : { scale: [0.6, 1.5], opacity: [0.7, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 2.4, delay: ring * 0.8, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="relative block h-16 w-16 overflow-hidden rounded-full bg-[#f5e8dd] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]"
        initial={reduce ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
      >
        <Image src="/2.svg" alt="" fill sizes="64px" className="object-contain p-1.5" />
      </motion.span>
    </div>
  );
}

/** The public sign-up form (/alta/[clinic]), trimmed to the parts the step talks about. */
function SignupFormMock({ focus }: { focus: "referral" | "consent" }) {
  const rise = useRise();

  return (
    <MockFrame>
      <motion.p {...rise(0)} className="px-1 font-serif text-base font-semibold text-[#2e2421]">
        Únete al club
      </motion.p>
      <div className="mt-2 space-y-2.5 rounded-xl bg-white/80 p-2.5">
        <Part active={false} delay={0.05}>
          <Field label="Nombre y apellidos" value="Verónica Navarro" />
        </Part>
        <Part active={focus === "referral"} delay={0.12} className="p-1">
          <Field label="Código de recomendación (opcional)" value="K7M2X" hint="Si te recomendó alguien, escribe su código" />
        </Part>
        <Part active={focus === "consent"} delay={0.2} className="space-y-2 p-1.5">
          <Checkbox checked label="Acepto que el centro trate mis datos según la política de privacidad." tag="Obligatoria" />
          <Checkbox checked={false} label="Quiero recibir notificaciones promocionales del centro." tag="Opcional" />
        </Part>
        <Part active={false} delay={0.28}>
          <p className="rounded-lg bg-[#161211] px-3 py-2 text-center text-xs font-bold text-white">Crear pase Wallet</p>
        </Part>
      </div>
    </MockFrame>
  );
}

/** A price that is corrected in front of the viewer: the catalogue's, then the one charged. */
function EditedPrice({ from, to }: { from: string; to: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{to}</>;

  return (
    <span className="inline-grid">
      <motion.span className="[grid-area:1/1]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.2, duration: 0.25 }}>
        {from}
      </motion.span>
      <motion.span className="[grid-area:1/1]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35, duration: 0.25 }}>
        {to}
      </motion.span>
    </span>
  );
}

const MULTIPLIERS = ["sin extra", "x2", "x3", "x5", "x10"];

/** The visit panel after a scan (program-visit-panel.tsx), one part in focus per step. */
function VisitPanelMock({ focus }: { focus: VisitFocus }) {
  const rise = useRise();
  const reduce = useReducedMotion();
  const bono = focus === "bono";

  return (
    <MockFrame>
      <motion.div {...rise(0)} className="flex items-center justify-between gap-2 rounded-xl bg-[#211918] px-3 py-2.5 text-[#fff8f2]">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d6a979]">Visita de miembro</p>
          <p className="mt-0.5 truncate font-serif text-base font-semibold">María G.</p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#e7d7cc]">
          Oro · 340 pts
        </span>
      </motion.div>

      <div className="mt-2 space-y-2">
        <Part active={bono} delay={0.08} className="flex flex-wrap items-center justify-between gap-2 bg-white/80 px-2.5 py-2">
          <p className="text-[11px] font-semibold text-[#2e2421]">Registrar una visita</p>
          <div className="flex gap-1 text-[10px] font-semibold">
            <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1", bono ? "border border-[#ded1c8] text-[#806d63]" : "bg-[#9f6b45] text-white")}>Pago</span>
            <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1", bono ? "bg-[#9f6b45] text-white" : "border border-[#ded1c8] text-[#806d63]")}>
              Sesión de bono
            </span>
          </div>
        </Part>

        {bono ? (
          <Part active delay={0.16} className="bg-white/80 p-2.5">
            <Field label="Bono del cliente" value="Bono facial 5 sesiones" />
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((dot) => (
                <motion.span
                  key={dot}
                  className={cn("h-2 flex-1 rounded-full", dot < 2 ? "bg-[#9f6b45]" : "bg-[#e2d5cc]")}
                  animate={dot === 2 && !reduce ? { backgroundColor: ["#e2d5cc", "#e5bd80", "#e2d5cc"] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-[#493832]">
              <span className="font-semibold">Bono facial 5 sesiones:</span> sesión 3 de 5 · quedan 3
            </p>
          </Part>
        ) : (
          <Part active={focus === "lines"} delay={0.16} className="space-y-2 bg-white/80 p-2.5">
            <div className="grid grid-cols-[1fr_76px] gap-2">
              <Field label="Qué se ha pagado" value="Higiene facial" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#806d63]">Importe (€)</p>
                <p className="mt-1 rounded-lg border border-[#ded1c8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2e2421]">
                  {focus === "lines" ? <EditedPrice from="60,00" to="55,00" /> : "55,00"}
                </p>
              </div>
            </div>
            <p className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#ded1c8] px-2.5 py-1 text-[10px] font-semibold text-[#493832]">
              <Plus className="h-3 w-3" /> Añadir otro importe
            </p>
          </Part>
        )}

        <Part active={focus === "extras"} delay={0.24} className="bg-white/80 p-2.5">
          <p className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#806d63]">
            {bono ? "Puntos extra" : "Productos con descuento y puntos extra"} <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </p>
          {focus === "extras" ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-[#ded1c8] bg-white p-2">
                <p className="flex justify-between gap-2 text-[11px] font-semibold text-[#2e2421]">
                  <span className="truncate">Sérum vitamina C</span> <span className="shrink-0">32,00 €</span>
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#493832]">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <span className="grid h-3.5 w-3.5 place-items-center rounded bg-[#2d211e] text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    Con descuento de nivel
                  </span>
                  <span className="whitespace-nowrap text-[#806d63]">Precio de lista (€): 40,00</span>
                </p>
              </div>
              <Field label="Puntos extra (opcional)" value="20" />
              <div>
                <p className="text-[10px] font-semibold text-[#806d63]">Multiplicar los 870 puntos de esta visita</p>
                <div className="relative mt-2 h-1.5 rounded-full bg-[#e2d5cc]">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#b8864b]"
                    initial={reduce ? false : { width: "0%" }}
                    animate={{ width: "25%" }}
                    transition={{ delay: 0.6, duration: 0.5, ease: EASE }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-[#927e72]">
                  {MULTIPLIERS.map((label) => (
                    <span key={label} className={cn("whitespace-nowrap", label === "x2" && "font-bold text-[#2e2421]")}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Part>

        <Part active={focus === "rewards"} delay={0.32} className="space-y-2">
          <p className="rounded-lg bg-[#b98a4f] px-3 py-2 text-center text-xs font-bold text-white">Registrar visita</p>
          <div className="rounded-xl bg-white/80 p-2.5">
            <p className="text-[11px] font-semibold text-[#2e2421]">Premios del cliente</p>
            {focus === "rewards" ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#ded1c8] bg-white px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-[#2e2421]">Limpieza facial de regalo</p>
                    <p className="text-[10px] text-[#927e72]">Caduca el 31/12/2026</p>
                  </div>
                  <motion.span
                    className="shrink-0 whitespace-nowrap rounded-md bg-[#b98a4f] px-2.5 py-1 text-[10px] font-bold text-white"
                    animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                    transition={{ delay: 0.8, duration: 0.5, repeat: Infinity, repeatDelay: 1.4 }}
                  >
                    Canjear
                  </motion.span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#ded1c8] bg-white px-2.5 py-1.5">
                  <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-semibold text-[#2e2421]">
                    <Gift className="h-3.5 w-3.5 shrink-0 text-[#b98a4f]" /> Puntos dobles
                  </p>
                  <p className="shrink-0 text-right text-[10px] leading-3 text-[#927e72]">Se aplica sola en la próxima visita</p>
                </div>
              </div>
            ) : null}
          </div>
        </Part>
      </div>
    </MockFrame>
  );
}

/** A made-up QR pattern (not a real code): three corner squares and a fixed scatter of modules. */
function FakeQr({ size }: { size: number }) {
  const cells = 21;
  const modules: Array<[number, number]> = [];
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inFinder && (x * 7 + y * 13 + x * y) % 5 < 2) modules.push([x, y]);
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#2e2421" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#2e2421" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} className="rounded bg-white" shapeRendering="crispEdges">
      {modules.map(([x, y]) => (
        <rect key={`${x}:${y}`} x={x} y={y} width={1} height={1} fill="#2e2421" />
      ))}
      {[finder(0, 0), finder(14, 0), finder(0, 14)]}
    </svg>
  );
}

/** The member page's "¿Ha perdido la tarjeta?" box (member-detail.tsx), button pressed. */
function CardRecoveryMock() {
  const rise = useRise();
  const reduce = useReducedMotion();

  return (
    <MockFrame>
      <motion.p {...rise(0)} className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-[#806d63]">
        <ArrowLeft className="h-3 w-3" /> Miembros · <span className="text-[#2e2421]">María G.</span>
      </motion.p>
      <motion.div {...rise(0.1)} className="mt-2 rounded-xl bg-white/80 p-3">
        <p className="text-xs font-semibold text-[#2e2421]">¿Ha perdido la tarjeta?</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#ded1c8] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2e2421] ring-2 ring-[#e5bd80] ring-offset-1">
          <WalletCards className="h-3.5 w-3.5 shrink-0" /> Volver a añadir la tarjeta a Wallet
        </p>
        <motion.div
          className="mt-3 flex items-center gap-3"
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: reduce ? 0 : 0.9, duration: 0.4, ease: EASE }}
        >
          <span className="shrink-0 rounded-lg border border-[#ded1c8] bg-white p-1.5">
            <FakeQr size={64} />
          </span>
          <p className="min-w-0 text-[11px] leading-4 text-[#493832]">
            Pide al cliente que escanee el código con la cámara del móvil y pulse «Añadir a Wallet».
          </p>
        </motion.div>
      </motion.div>
    </MockFrame>
  );
}

const SEGMENT_OPTIONS = ["Todos los miembros activos", "Miembros con bono activo", "Clientas 50+ · 48 personas"];

/** The "Configurar envío" dialog's Segmento and Cuándo fields (communications-page-client.tsx). */
function SendSetupMock() {
  const rise = useRise();
  const reduce = useReducedMotion();

  return (
    <MockFrame>
      <motion.div {...rise(0)} className="rounded-xl bg-white/80 p-2.5">
        <p className="text-[10px] font-semibold text-[#806d63]">Segmento</p>
        <div className="mt-1 overflow-hidden rounded-lg border border-[#ded1c8] bg-white">
          {SEGMENT_OPTIONS.map((option, index) => (
            <motion.p
              key={option}
              className="truncate px-2.5 py-1.5 text-[11px] font-semibold text-[#493832]"
              initial={false}
              animate={
                index === 2
                  ? { backgroundColor: reduce ? "#2d211e" : ["#ffffff", "#ffffff", "#2d211e"], color: reduce ? "#ffffff" : ["#493832", "#493832", "#ffffff"] }
                  : undefined
              }
              transition={{ delay: 0.4, duration: 0.8, times: [0, 0.5, 1] }}
            >
              {option}
            </motion.p>
          ))}
        </div>
      </motion.div>
      <motion.div {...rise(0.15)} className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-white/80 p-2.5">
        <Field label="Cuándo" value="Programar fecha y hora" />
        <Field label="Fecha y hora de envío" value="24/12 · 10:00" />
      </motion.div>
      <motion.p {...rise(0.25)} className="mt-2 rounded-lg bg-[#2d211e] px-3 py-2 text-center text-xs font-bold text-white">
        Programar comunicación
      </motion.p>
    </MockFrame>
  );
}

/** One Inspírate idea: who to send it to and the message, ready to copy. Not decorative. */
function CampaignScene({ id }: { id: CampaignId }) {
  const rise = useRise();
  const campaign = findCampaign(id);
  const usesTiers = campaign.audiences.some((audience) => audience.segments.some((segment) => segment.startsWith("Nivel")));

  return (
    <div className="mb-4 space-y-2.5">
      {campaign.audiences.map((audience, index) => (
        <motion.div key={audience.label} {...rise(0.05 + index * 0.12)} className="rounded-2xl border border-[#e2d5cc] bg-[#f6f1ed] p-3">
          <AudienceIdea audience={audience} />
        </motion.div>
      ))}
      {usesTiers ? (
        <p className="flex items-start gap-1.5 px-1 text-[11px] leading-4 text-[#927e72]">
          <Info className="mt-0.5 h-3 w-3 shrink-0" /> {TOUR_UI.tierNamesNote}
        </p>
      ) : null}
    </div>
  );
}

function AudienceIdea({ audience }: { audience: CampaignAudience }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(audience.message);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions, insecure origin): the text is on screen to copy by hand.
    }
  };

  const perTier = audience.segments.length > 1;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="mr-1 text-xs font-semibold text-[#2e2421]">{audience.label}</p>
        {audience.segments.map((segment) => (
          <span key={segment} className="whitespace-nowrap rounded-full border border-[#d8c8bd] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#493832]">
            {segment}
          </span>
        ))}
      </div>
      {perTier ? <p className="mt-1 text-[10px] leading-4 text-[#927e72]">{TOUR_UI.oneSegmentEach}</p> : null}
      <div className="mt-2 rounded-xl bg-white px-3 py-2.5 shadow-[0_8px_24px_-16px_rgba(34,24,20,0.5)]">
        <p className="text-[12px] leading-[18px] text-[#2e2421]">{audience.message}</p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void copy()}
            aria-label={TOUR_UI.copyMessageLabel(audience.label)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#d8c8bd] bg-[#fffaf6] px-3 text-[11px] font-semibold text-[#493832] transition hover:bg-[#f4e8df]"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#3d6a48]" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
            <TourText>{copied ? TOUR_UI.copiedMessage : TOUR_UI.copyMessage}</TourText>
          </button>
        </div>
      </div>
    </>
  );
}
