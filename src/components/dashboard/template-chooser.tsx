"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, LockKeyhole, Paintbrush, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";

import { templateStarters } from "@/components/dashboard/template-starters";
import { Button } from "@/components/ui/button";
import { WalletCard, WALLET_THEMES, type WalletCardTheme } from "@/components/ui/wallet-card";
import { getCurrentClinicTemplate, getTemplatePresets, type Template } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface TemplateLandingGateProps {
  clinicId: string;
  canEdit: boolean;
  initialTemplate: Template | null;
}

export function TemplateLandingGate({ clinicId, canEdit, initialTemplate }: TemplateLandingGateProps) {
  const reducedMotion = useReducedMotion();
  const currentTemplate = useQuery({
    queryKey: ["clinic-template", clinicId],
    queryFn: () => getCurrentClinicTemplate(clinicId),
    initialData: initialTemplate,
  });
  const presets = useQuery({ queryKey: ["template-presets"], queryFn: getTemplatePresets });

  if (!canEdit) {
    return (
      <div className="voone-panel flex items-center gap-4 p-5">
        <LockKeyhole className="h-5 w-5 text-[#a47845]" />
        <p className="text-sm text-muted-foreground">Solo owner o manager pueden crear la plantilla Wallet de la clínica.</p>
      </div>
    );
  }

  if (presets.isPending) {
    return <div className="voone-panel p-5 text-sm text-muted-foreground">Cargando diseños iniciales...</div>;
  }

  if (presets.error) {
    return <div className="voone-panel p-5 text-sm text-destructive">No se pudieron cargar las plantillas iniciales.</div>;
  }

  const [signaturePreset, diamondPreset, scratchPreset] = presets.data;
  const selectedTemplate = currentTemplate.data;
  const selectedPresetId = selectedTemplate?.presetId ?? selectedTemplate?.preset?.id;
  const isScratchSelected = Boolean(selectedTemplate && selectedPresetId && selectedPresetId === scratchPreset?.id);
  const isScratchDisabled = Boolean(selectedTemplate && !isScratchSelected);
  const containerVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
      };
  const cardVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const } },
      };
  const rows = [
    {
      starter: templateStarters["signature-glow"],
      href: `/dashboard/templates/new${signaturePreset ? `?presetId=${encodeURIComponent(signaturePreset.id)}` : ""}`,
      theme: WALLET_THEMES.gold,
      presetId: signaturePreset?.id,
    },
    {
      starter: templateStarters["diamond-skin"],
      href: `/dashboard/templates/new${diamondPreset ? `?presetId=${encodeURIComponent(diamondPreset.id)}` : ""}`,
      theme: WALLET_THEMES.diamond,
      presetId: diamondPreset?.id,
    },
  ];

  return (
    <motion.section
      className="mx-auto grid max-w-[1160px] gap-3 lg:grid-cols-3"
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
      variants={containerVariants}
    >
      {rows.map((row) => {
        const isSelected = Boolean(selectedTemplate && selectedPresetId && row.presetId === selectedPresetId);
        const isDisabled = Boolean(selectedTemplate && !isSelected);

        return (
          <motion.div key={row.starter.id} className={cn("voone-panel h-full p-3 md:p-4", isSelected && "ring-2 ring-gold/70", isDisabled && "grayscale opacity-45")} variants={cardVariants}>
            <div className="relative flex h-full flex-col gap-3">
              {isSelected ? <SelectedTemplateTag /> : null}
              <OverlappingWalletCards starter={row.starter} theme={row.theme} reducedMotion={reducedMotion} />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[#fff8ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {row.starter.eyebrow}
                </div>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">{row.starter.title}</h2>
                <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-muted-foreground">{row.starter.description}</p>
              </div>
              <TemplateCardAction href={row.href} isSelected={isSelected} isDisabled={isDisabled} selectedTemplateId={selectedTemplate?.id} />
            </div>
          </motion.div>
        );
      })}

      <motion.div
        className={cn(
          "voone-panel h-full p-3 md:p-4",
          isScratchSelected && "ring-2 ring-gold/70",
          isScratchDisabled && "grayscale opacity-45"
        )}
        variants={cardVariants}
      >
        <div className="relative flex h-full flex-col gap-3">
          {isScratchSelected ? <SelectedTemplateTag /> : null}
          <BlankTemplateCard reducedMotion={reducedMotion} />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[#fff8ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">
              <Paintbrush className="h-3.5 w-3.5" />
              {templateStarters.scratch.eyebrow}
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">{templateStarters.scratch.title}</h2>
            <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-muted-foreground">{templateStarters.scratch.description}</p>
          </div>
          <TemplateCardAction
            href={`/dashboard/templates/new${scratchPreset ? `?presetId=${encodeURIComponent(scratchPreset.id)}` : ""}`}
            isSelected={isScratchSelected}
            isDisabled={isScratchDisabled}
            selectedTemplateId={selectedTemplate?.id}
            variant="outline"
            idleLabel="Empezar en blanco"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}

function TemplateCardAction({
  href,
  isSelected,
  isDisabled,
  selectedTemplateId,
  variant,
  idleLabel = "Usar plantilla",
}: {
  href: string;
  isSelected: boolean;
  isDisabled: boolean;
  selectedTemplateId: string | undefined;
  variant?: React.ComponentProps<typeof Button>["variant"];
  idleLabel?: string;
}) {
  if (isSelected && selectedTemplateId) {
    return (
      <Button asChild className="mt-auto h-10 rounded-2xl px-4">
        <Link href={`/dashboard/templates/${selectedTemplateId}`}>
          Editar plantilla <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (isDisabled) {
    return (
      <Button disabled variant={variant} className="mt-auto h-10 rounded-2xl px-4">
        No disponible <LockKeyhole className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className="mt-auto h-10 rounded-2xl px-4">
      <Link href={href}>
        {idleLabel} <ArrowUpRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}

function SelectedTemplateTag() {
  return (
    <span className="absolute right-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-[#fff8ed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f6330] shadow-sm">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Seleccionada
    </span>
  );
}

function OverlappingWalletCards({ starter, theme, reducedMotion }: { starter: (typeof templateStarters)["signature-glow"]; theme: WalletCardTheme; reducedMotion: boolean | null }) {
  return (
    <div className="relative mx-auto h-[190px] w-[215px] overflow-visible sm:w-[230px]">
      <motion.div
        className="absolute left-2 top-2 origin-top-left -rotate-6 scale-[0.32] sm:scale-[0.34]"
        initial={reducedMotion ? false : { opacity: 0, x: -26, y: 34 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <WalletCard data={starter.appleCard} theme={theme} defaultExpanded interactive={false} />
      </motion.div>
      <motion.div
        className="absolute left-[92px] top-5 origin-top-left rotate-5 scale-[0.32] sm:left-[100px] sm:scale-[0.34]"
        initial={reducedMotion ? false : { opacity: 0, x: 30, y: 40 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.72, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <WalletCard data={starter.googleCard} theme={theme} defaultExpanded interactive={false} />
      </motion.div>
    </div>
  );
}

function BlankTemplateCard({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
    <motion.div
      className="relative mx-auto h-[190px] w-[215px] overflow-hidden rounded-[22px] border border-dashed border-[#c8bbae] bg-[linear-gradient(145deg,#fffdf8_0%,#f4eee6_100%)] p-5 shadow-inner sm:w-[230px]"
      initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-[#e8d8c8] blur-3xl" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="h-3 w-28 rounded-full bg-[#ded5c9]" />
          <div className="mt-3 h-2 w-20 rounded-full bg-[#e9e0d5]" />
        </div>
        <div className="grid h-14 w-14 grid-cols-3 gap-1 rounded-lg bg-white p-2 shadow-sm">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className={index % 2 === 0 ? "rounded-[2px] bg-[#d8ccbe]" : "rounded-[2px] bg-[#f1e8dd]"} />
          ))}
        </div>
      </div>
      <div className="relative mt-8 h-6 w-40 rounded-full bg-[#d8ccbe]" />
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="h-12 rounded-2xl bg-white/80" />
        <div className="h-12 rounded-2xl bg-white/80" />
      </div>
    </motion.div>
  );
}