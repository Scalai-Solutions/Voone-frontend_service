"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, Edit3, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Template, TemplatePreset } from "@/lib/api-client";

type DesignOption = {
  id: string;
  href: string;
  name: string;
  programName: string;
  color: string;
  pointsLabel: string;
  tierLabel: string;
  detail: string;
};

function designOptions(templates: Template[], presets: TemplatePreset[]): DesignOption[] {
  const templateOptions = templates.slice(0, 2).map((template) => ({
    id: template.id,
    href: `/admin/templates/${template.id}`,
    name: template.preset?.name ?? template.name ?? template.programName,
    programName: template.programName,
    color: template.hexBackgroundColor,
    pointsLabel: template.pointsLabel,
    tierLabel: template.tierLabel,
    detail: template.benefitsText,
  }));
  const alternatePreset = presets.find((preset) => !templateOptions.some((template) => template.color === preset.hexBackgroundColor)) ?? presets[0];

  return [
    ...templateOptions,
    {
      id: "new",
      href: `/admin/templates/new${alternatePreset ? `?preset=${encodeURIComponent(alternatePreset.id)}` : ""}`,
      name: "New direction",
      programName: alternatePreset ? `${alternatePreset.name} Club` : "Signature Rewards",
      color: alternatePreset?.hexBackgroundColor ?? "#d8efe3",
      pointsLabel: "Points balance",
      tierLabel: "Member tier",
      detail: "A third editable direction for onboarding teams to personalise.",
    },
  ];
}

export function AdminTemplateGallery({ templates, presets }: { templates: Template[]; presets: TemplatePreset[] }) {
  const options = designOptions(templates, presets);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-[#ded2cb] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-[#806d63]">Choose a direction to edit its content, colors, and reward messaging.</p></div>
        <Button asChild className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]"><Link href="/admin/templates/new"><Plus className="mr-2 h-4 w-4" /> New template</Link></Button>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {options.map((option, index) => (
          <Link key={option.id} href={option.href} className="group overflow-hidden rounded-[20px] border border-[#ded2cb] bg-white p-3 shadow-[0_12px_28px_rgba(67,48,43,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(67,48,43,0.16)]">
            <TemplatePassPreview option={option} compact />
            <div className="px-2 pb-2 pt-4">
              <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{option.name}</h2><Edit3 className="h-4 w-4 text-[#a47845]" /></div>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#806d63]">{option.detail}</p>
              <p className="mt-3 text-xs font-semibold text-[#a47845]">{index === 2 ? "Create a new direction" : "Open live editor"}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function AdminTemplateEditor({ template, presets, selectedPresetId }: { template?: Template; presets: TemplatePreset[]; selectedPresetId?: string }) {
  const selectedPreset = presets.find((preset) => preset.id === (template?.presetId ?? selectedPresetId)) ?? presets[0];
  const [name, setName] = React.useState(template?.programName ?? (selectedPreset ? `${selectedPreset.name} Club` : "Signature Rewards"));
  const [pointsLabel, setPointsLabel] = React.useState(template?.pointsLabel ?? "Points balance");
  const [tierLabel, setTierLabel] = React.useState(template?.tierLabel ?? "Member tier");
  const [benefits, setBenefits] = React.useState(template?.benefitsText ?? "Priority booking, surprise rewards and a birthday credit for loyal members.");
  const [info, setInfo] = React.useState(template?.infoText ?? "Show this pass at reception before payment.");
  const [colors, setColors] = React.useState([template?.hexBackgroundColor ?? selectedPreset?.hexBackgroundColor ?? "#ead0bd", "#201715", "#b98a4f"]);
  const [saved, setSaved] = React.useState(false);
  const designName = template?.preset?.name ?? selectedPreset?.name ?? "New template";

  function updateColor(index: number, value: string) {
    setColors((current) => current.map((color, colorIndex) => colorIndex === index ? value : color));
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/admin/templates" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> All template designs</Link>
        <Button type="button" onClick={() => setSaved(true)} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">{saved ? <><Check className="mr-2 h-4 w-4" /> Draft saved</> : "Save design"}</Button>
      </div>

      <section className="grid gap-5 lg:grid-cols-[370px_minmax(0,1fr)]">
        <div className="rounded-[22px] bg-[#201715] p-6 text-[#fff8f2] shadow-[0_18px_38px_rgba(67,48,43,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8cf9a]">Live preview</p>
          <div className="mt-5"><TemplatePassPreview option={{ id: "preview", href: "#", name: designName, programName: name, color: colors[0], pointsLabel, tierLabel, detail: benefits }} /></div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm text-[#dbcac1]"><p className="font-semibold text-white">Pass message</p><p className="mt-2 leading-6">{info}</p></div>
        </div>

        <form className="rounded-[22px] border border-[#ded2cb] bg-white p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Template editor</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{designName}</h1></div><CreditCard className="h-5 w-5 text-[#a47845]" /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <EditorField label="Program name"><Input value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="rounded-xl bg-[#fffaf6]" /></EditorField>
            <EditorField label="Points label"><Input value={pointsLabel} onChange={(event) => { setPointsLabel(event.target.value); setSaved(false); }} className="rounded-xl bg-[#fffaf6]" /></EditorField>
            <EditorField label="Tier label"><Input value={tierLabel} onChange={(event) => { setTierLabel(event.target.value); setSaved(false); }} className="rounded-xl bg-[#fffaf6]" /></EditorField>
            <EditorField label="Logo"><Input placeholder="Upload vector logo" className="rounded-xl bg-[#fffaf6]" /></EditorField>
          </div>
          <div className="mt-5"><p className="text-sm font-semibold">Brand colors</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{colors.map((color, index) => <label key={index} className="flex items-center gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] px-3 py-2 text-sm"><input aria-label={`Brand color ${index + 1}`} type="color" value={color} onChange={(event) => updateColor(index, event.target.value)} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" /><span>{color}</span></label>)}</div></div>
          <div className="mt-5 grid gap-4">
            <EditorField label="Member benefits"><Textarea value={benefits} onChange={(event) => { setBenefits(event.target.value); setSaved(false); }} className="min-h-24 rounded-xl bg-[#fffaf6]" /></EditorField>
            <EditorField label="Pass information"><Textarea value={info} onChange={(event) => { setInfo(event.target.value); setSaved(false); }} className="min-h-20 rounded-xl bg-[#fffaf6]" /></EditorField>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[#eadfd8] pt-4"><p className="text-xs text-[#927e72]">Changes update the preview immediately.</p><Button type="submit" className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">Save design</Button></div>
        </form>
      </section>
    </div>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>;
}

function TemplatePassPreview({ option, compact = false }: { option: DesignOption; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[18px] border border-white/45 p-4 shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${compact ? "min-h-52" : "min-h-72"}`} style={{ backgroundColor: option.color, color: option.color === "#2f343a" ? "#fff8f2" : "#2e2421" }}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</p><p className="mt-1 text-sm font-semibold">{option.name}</p></div><Sparkles className="h-5 w-5 opacity-80" /></div>
      <p className="relative mt-8 font-serif text-2xl font-semibold leading-tight">{option.programName}</p>
      <div className="relative mt-6 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/20 p-3"><p className="text-[9px] uppercase opacity-70">Points</p><p className="mt-1 font-semibold">1,250</p><p className="mt-1 text-[10px] opacity-75">{option.pointsLabel}</p></div><div className="rounded-xl bg-white/20 p-3"><p className="text-[9px] uppercase opacity-70">Tier</p><p className="mt-1 font-semibold">Gold</p><p className="mt-1 text-[10px] opacity-75">{option.tierLabel}</p></div></div>
    </div>
  );
}