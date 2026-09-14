"use client";

import Link from "next/link";
import { ArrowUpRight, Paintbrush, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { templateStarters } from "@/components/dashboard/template-starters";
import { Button } from "@/components/ui/button";
import { WalletCard, WALLET_THEMES, type WalletCardTheme } from "@/components/ui/wallet-card";

interface TemplateChooserProps {
  canEdit: boolean;
  templateIds: {
    signatureGlow: string;
    diamondSkin: string;
    scratch: string;
  };
}

export function TemplateChooser({ canEdit, templateIds }: TemplateChooserProps) {
  const reducedMotion = useReducedMotion();
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
      href: `/dashboard/templates/${templateIds.signatureGlow}?starter=signature-glow`,
      theme: WALLET_THEMES.gold,
    },
    {
      starter: templateStarters["diamond-skin"],
      href: `/dashboard/templates/${templateIds.diamondSkin}?starter=diamond-skin`,
      theme: WALLET_THEMES.diamond,
    },
  ];

  return (
    <motion.section
      className="grid gap-4 lg:grid-cols-3"
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
      variants={containerVariants}
    >
      {rows.map((row) => (
        <motion.div key={row.starter.id} className="voone-panel h-full p-4 md:p-5" variants={cardVariants}>
          <div className="relative flex h-full flex-col gap-5">
            <OverlappingWalletCards starter={row.starter} theme={row.theme} reducedMotion={reducedMotion} />
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[#fff8ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">
                <Sparkles className="h-3.5 w-3.5" />
                {row.starter.eyebrow}
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">{row.starter.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{row.starter.description}</p>
            </div>
            {canEdit ? (
              <Button asChild className="mt-auto rounded-2xl px-5">
                <Link href={row.href}>
                  Use template <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </motion.div>
      ))}

      <motion.div className="voone-panel h-full p-4 md:p-5" variants={cardVariants}>
        <div className="relative flex h-full flex-col gap-5">
          <BlankTemplateCard reducedMotion={reducedMotion} />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[#fff8ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">
              <Paintbrush className="h-3.5 w-3.5" />
              {templateStarters.scratch.eyebrow}
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">{templateStarters.scratch.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{templateStarters.scratch.description}</p>
          </div>
          {canEdit ? (
            <Button asChild variant="outline" className="mt-auto rounded-2xl px-5">
              <Link href={`/dashboard/templates/${templateIds.scratch}?starter=scratch`}>
                Start blank <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </motion.div>
    </motion.section>
  );
}

function OverlappingWalletCards({ starter, theme, reducedMotion }: { starter: (typeof templateStarters)["signature-glow"]; theme: WalletCardTheme; reducedMotion: boolean | null }) {
  return (
    <div className="relative mx-auto h-[265px] w-[260px] overflow-visible sm:w-[280px] xl:w-[300px]">
      <motion.div
        className="absolute left-0 top-4 origin-top-left -rotate-6 scale-[0.46] sm:scale-[0.48] xl:scale-[0.5]"
        initial={reducedMotion ? false : { opacity: 0, x: -26, y: 34 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <WalletCard data={starter.appleCard} theme={theme} defaultExpanded interactive={false} />
      </motion.div>
      <motion.div
        className="absolute left-[100px] top-8 origin-top-left rotate-5 scale-[0.46] sm:left-[108px] sm:scale-[0.48] xl:left-[116px] xl:scale-[0.5]"
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
      className="relative mx-auto h-[235px] w-[260px] overflow-hidden rounded-[24px] border border-dashed border-[#c8bbae] bg-[linear-gradient(145deg,#fffdf8_0%,#f4eee6_100%)] p-6 shadow-inner sm:w-[280px] xl:w-[300px]"
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