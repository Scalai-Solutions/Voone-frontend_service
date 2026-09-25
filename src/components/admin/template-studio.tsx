"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Edit3,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveAdminTemplate } from "@/features/templates/api/useSaveAdminTemplate";
import { useTemplates } from "@/features/templates/api/useTemplates";
import {
  ApiError,
  type SaveVooneTemplateInput,
  type VooneTemplate,
  type VooneTemplateButton,
  type VooneTemplateTextModule,
  type TemplatePreset,
} from "@/lib/api-client";

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

function designOptions(templates: VooneTemplate[]): DesignOption[] {
  return templates.map((template) => ({
    id: template.id,
    href: `/admin/templates/${template.id}`,
    name: template.name,
    programName: template.programName,
    color: template.hexBackgroundColor,
    pointsLabel: template.pointsLabel,
    tierLabel: template.tierLabel,
    detail: template.description ?? "Reusable Voone Wallet design.",
  }));
}

export function AdminTemplateGallery({
  templates,
}: {
  templates: VooneTemplate[];
}) {
  const templatesQuery = useTemplates({ initialData: templates });
  const currentTemplates = templatesQuery.data ?? templates;
  const options = designOptions(currentTemplates);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-[#ded2cb] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#806d63]">
            Choose a direction to edit its content, colors, and reward
            messaging.
          </p>
        </div>
        <Button
          asChild
          className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]"
        >
          <Link href="/admin/templates/new">
            <Plus className="mr-2 h-4 w-4" /> New template
          </Link>
        </Button>
      </div>
      {currentTemplates.length ? (
        <section className="grid gap-4 md:grid-cols-3">
          {options.map((option, index) => (
            <Link
              key={option.id}
              href={option.href}
              className="group overflow-hidden rounded-[20px] border border-[#ded2cb] bg-white p-3 shadow-[0_12px_28px_rgba(67,48,43,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(67,48,43,0.16)]"
            >
              <TemplatePassPreview option={option} compact />
              <div className="px-2 pb-2 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{option.name}</h2>
                  <Edit3 className="h-4 w-4 text-[#a47845]" />
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#806d63]">
                  {option.detail}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#a47845]">
                  {index === 2 ? "Create a new direction" : "Open live editor"}
                </p>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-[20px] border border-dashed border-[#ded2cb] bg-white/70 p-8 text-center text-sm font-semibold text-[#806d63]">
          No pass created.
        </div>
      )}
    </div>
  );
}

export function AdminTemplateEditor({
  template,
  presets,
  selectedPresetId,
}: {
  template?: VooneTemplate;
  presets: TemplatePreset[];
  selectedPresetId?: string;
}) {
  const router = useRouter();
  const selectedPreset =
    presets.find(
      (preset) => preset.id === (template?.presetId ?? selectedPresetId),
    ) ?? presets[0];
  const [presetId, setPresetId] = React.useState(
    template?.presetId ?? selectedPreset?.id ?? "",
  );
  const [description, setDescription] = React.useState(
    template?.description ?? "Reusable Voone Wallet design.",
  );
  const [name, setName] = React.useState(
    template?.name ??
      (selectedPreset ? `${selectedPreset.name} Club` : "Signature Rewards"),
  );
  const [programName, setProgramName] = React.useState(
    template?.programName ??
      (selectedPreset ? `${selectedPreset.name} Club` : "Signature Rewards"),
  );
  const [pointsLabel, setPointsLabel] = React.useState(
    template?.pointsLabel ?? "Points balance",
  );
  const [tierLabel, setTierLabel] = React.useState(
    template?.tierLabel ?? "Member tier",
  );
  const [logoUrl, setLogoUrl] = React.useState(template?.logoUrl ?? "");
  const [heroImageUrl, setHeroImageUrl] = React.useState(
    template?.heroImageUrl ?? "",
  );
  const [buttons, setButtons] = React.useState<VooneTemplateButton[]>(
    template?.buttons ?? [
      {
        label: "Website",
        url: "https://voone.app",
        description: "Website",
        primary: false,
      },
      {
        label: "Schedule Appointment",
        url: "https://voone.app/alta/sapphira-prive",
        description: "Schedule an appointment",
        primary: true,
      },
    ],
  );
  const [textModules, setTextModules] = React.useState<
    VooneTemplateTextModule[]
  >(
    template?.textModules ?? [
      { label: "Clinic", value: "Sapphira Privé" },
      {
        label: "Benefits",
        value: "10% off facial treatments and birthday surprises.",
      },
      {
        label: "Information",
        value: "This membership card is personal and non-transferable.",
      },
    ],
  );
  const [colors, setColors] = React.useState([
    template?.hexBackgroundColor ??
      selectedPreset?.hexBackgroundColor ??
      "#ead0bd",
    "#201715",
    "#b98a4f",
  ]);
  const [saved, setSaved] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const designName = template?.name ?? selectedPreset?.name ?? "New template";
  const saveMutation = useSaveAdminTemplate(template?.id, {
    onSuccess: (savedTemplate) => {
      setSaved(true);
      setStatus(
        "Voone template saved. It is ready to assign to a clinic Wallet class.",
      );

      if (!template?.id) {
        router.replace(`/admin/templates/${savedTemplate.id}`);
      }
    },
    onError: (error) => {
      const detail = error instanceof ApiError ? error.detail : undefined;
      setStatus(
        detail ??
          "Template could not be saved. Check required fields and try again.",
      );
    },
  });

  function updateColor(index: number, value: string) {
    setColors((current) =>
      current.map((color, colorIndex) =>
        colorIndex === index ? value : color,
      ),
    );
    setSaved(false);
  }

  function saveDesign() {
    setStatus(null);

    const input: SaveVooneTemplateInput = {
      presetId,
      name,
      description,
      programName,
      hexBackgroundColor: colors[0],
      logoUrl,
      heroImageUrl,
      pointsLabel,
      tierLabel,
      buttons,
      textModules,
    };

    saveMutation.mutate(input);
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"
        >
          <ArrowLeft className="h-4 w-4" /> All template designs
        </Link>
        <Button
          type="button"
          onClick={saveDesign}
          disabled={saveMutation.isPending}
          className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]"
        >
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Saved
            </>
          ) : saveMutation.isPending ? (
            "Saving..."
          ) : (
            "Save design"
          )}
        </Button>
      </div>

      <section className="grid gap-5 lg:grid-cols-[370px_minmax(0,1fr)]">
        <div className="rounded-[22px] bg-[#201715] p-6 text-[#fff8f2] shadow-[0_18px_38px_rgba(67,48,43,0.18)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8cf9a]">
            Live preview
          </p>
          <div className="mt-5">
            <TemplatePassPreview
              option={{
                id: "preview",
                href: "#",
                name: designName,
                programName: name,
                color: colors[0],
                pointsLabel,
                tierLabel,
                detail: description,
              }}
            />
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm text-[#dbcac1]">
            <p className="font-semibold text-white">Pass message</p>
            <p className="mt-2 leading-6">{description}</p>
          </div>
        </div>

        <form
          className="rounded-[22px] border border-[#ded2cb] bg-white p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]"
          onSubmit={(event) => {
            event.preventDefault();
            void saveDesign();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">
                Template editor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {designName}
              </h1>
            </div>
            <CreditCard className="h-5 w-5 text-[#a47845]" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <EditorField label="Template name">
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                placeholder="Sapphira Privé Member Club"
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Template description">
              <Input
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setSaved(false);
                }}
                placeholder="Reusable loyalty design for premium clinics"
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Preset">
              <select
                value={presetId}
                onChange={(event) => {
                  setPresetId(event.target.value);
                  setSaved(false);
                }}
                className="h-10 rounded-xl border border-input bg-[#fffaf6] px-3 text-sm"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </EditorField>
            <EditorField label="Program name">
              <Input
                value={programName}
                onChange={(event) => {
                  setProgramName(event.target.value);
                  setSaved(false);
                }}
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Points label">
              <Input
                value={pointsLabel}
                onChange={(event) => {
                  setPointsLabel(event.target.value);
                  setSaved(false);
                }}
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Tier label">
              <Input
                value={tierLabel}
                onChange={(event) => {
                  setTierLabel(event.target.value);
                  setSaved(false);
                }}
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Logo URL">
              <Input
                value={logoUrl}
                onChange={(event) => {
                  setLogoUrl(event.target.value);
                  setSaved(false);
                }}
                placeholder="https://.../logo.png"
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
            <EditorField label="Hero image URL">
              <Input
                value={heroImageUrl}
                onChange={(event) => {
                  setHeroImageUrl(event.target.value);
                  setSaved(false);
                }}
                placeholder="https://.../hero.png"
                className="rounded-xl bg-[#fffaf6]"
              />
            </EditorField>
          </div>
          <div className="mt-5">
            <p className="text-sm font-semibold">Brand colors</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {colors.map((color, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] px-3 py-2 text-sm"
                >
                  <input
                    aria-label={`Brand color ${index + 1}`}
                    type="color"
                    value={color}
                    onChange={(event) => updateColor(index, event.target.value)}
                    className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  />
                  <span>{color}</span>
                </label>
              ))}
            </div>
          </div>
          <section className="mt-6 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Wallet buttons</p>
                <p className="mt-1 text-xs text-[#927e72]">
                  Add zero, one, or multiple links. Mark one as the primary CTA.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setButtons((current) => [
                    ...current,
                    {
                      label: "New button",
                      url: "https://",
                      description: "",
                      primary: false,
                    },
                  ]);
                  setSaved(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add button
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {buttons.map((button, index) => (
                <div
                  key={`${index}-${button.label}`}
                  className="grid gap-3 rounded-xl border border-[#ded2cb] bg-white p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]"
                >
                  <Input
                    value={button.label}
                    maxLength={30}
                    placeholder="Button label"
                    onChange={(event) => {
                      setButtons((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  <Input
                    value={button.url}
                    placeholder="https://..."
                    onChange={(event) => {
                      setButtons((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, url: event.target.value }
                            : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  <Input
                    value={button.description ?? ""}
                    placeholder="Description"
                    onChange={(event) => {
                      setButtons((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={button.primary}
                        onChange={(event) => {
                          setButtons((current) =>
                            current.map((item, itemIndex) => ({
                              ...item,
                              primary:
                                itemIndex === index
                                  ? event.target.checked
                                  : false,
                            })),
                          );
                          setSaved(false);
                        }}
                      />{" "}
                      Primary
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setButtons((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                        setSaved(false);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-6 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Wallet text modules</p>
                <p className="mt-1 text-xs text-[#927e72]">
                  Labels and copy shown in the card details section.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setTextModules((current) => [
                    ...current,
                    { label: "New label", value: "" },
                  ]);
                  setSaved(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add text
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {textModules.map((module, index) => (
                <div
                  key={`${index}-${module.label}`}
                  className="grid gap-3 rounded-xl border border-[#ded2cb] bg-white p-3 sm:grid-cols-[180px_1fr_auto]"
                >
                  <Input
                    value={module.label}
                    placeholder="Label"
                    onChange={(event) => {
                      setTextModules((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  <Textarea
                    value={module.value}
                    placeholder="Text shown on the pass"
                    onChange={(event) => {
                      setTextModules((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setTextModules((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      );
                      setSaved(false);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </section>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#eadfd8] pt-4">
            <p
              className={`text-xs ${status?.startsWith("Voone template saved") ? "text-[#2f7d57]" : status ? "text-destructive" : "text-[#927e72]"}`}
            >
              {status ?? "Changes update the preview immediately."}
            </p>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]"
            >
              {saveMutation.isPending ? "Saving..." : "Save design"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

function TemplatePassPreview({
  option,
  compact = false,
}: {
  option: DesignOption;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-white/45 p-4 shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${compact ? "min-h-52" : "min-h-72"}`}
      style={{
        backgroundColor: option.color,
        color: option.color === "#2f343a" ? "#fff8f2" : "#2e2421",
      }}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
            VOONE PASS
          </p>
          <p className="mt-1 text-sm font-semibold">{option.name}</p>
        </div>
        <Sparkles className="h-5 w-5 opacity-80" />
      </div>
      <p className="relative mt-8 font-serif text-2xl font-semibold leading-tight">
        {option.programName}
      </p>
      <div className="relative mt-6 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/20 p-3">
          <p className="text-[9px] uppercase opacity-70">Points</p>
          <p className="mt-1 font-semibold">1,250</p>
          <p className="mt-1 text-[10px] opacity-75">{option.pointsLabel}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-3">
          <p className="text-[9px] uppercase opacity-70">Tier</p>
          <p className="mt-1 font-semibold">Gold</p>
          <p className="mt-1 text-[10px] opacity-75">{option.tierLabel}</p>
        </div>
      </div>
    </div>
  );
}
