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
import {
  DEFAULT_WALLET_BACKGROUND_COLOR,
  DEFAULT_WALLET_BUTTONS,
  DEFAULT_WALLET_HERO_IMAGE_URL,
  DEFAULT_WALLET_LOGO_URL,
  DEFAULT_WALLET_POINTS_LABEL,
  DEFAULT_WALLET_PROGRAM_NAME,
  DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  DEFAULT_WALLET_TEMPLATE_NAME,
  DEFAULT_WALLET_TEXT_MODULES,
  DEFAULT_WALLET_TIER_LABEL,
} from "@/lib/default-wallet-template";

type DesignOption = {
  id: string;
  href: string;
  name: string;
  programName: string;
  color: string;
  pointsLabel: string;
  tierLabel: string;
  detail: string;
  logoUrl?: string;
  heroImageUrl?: string;
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
    logoUrl: template.logoUrl ?? undefined,
    heroImageUrl: template.heroImageUrl ?? undefined,
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
    template?.description ?? DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  );
  const [name, setName] = React.useState(
    template?.name ?? DEFAULT_WALLET_TEMPLATE_NAME,
  );
  const [programName, setProgramName] = React.useState(
    template?.programName ?? DEFAULT_WALLET_PROGRAM_NAME,
  );
  const [pointsLabel, setPointsLabel] = React.useState(
    template?.pointsLabel ?? DEFAULT_WALLET_POINTS_LABEL,
  );
  const [tierLabel, setTierLabel] = React.useState(
    template?.tierLabel ?? DEFAULT_WALLET_TIER_LABEL,
  );
  const [logoUrl, setLogoUrl] = React.useState(
    template?.logoUrl ?? DEFAULT_WALLET_LOGO_URL,
  );
  const [heroImageUrl, setHeroImageUrl] = React.useState(
    template?.heroImageUrl ?? DEFAULT_WALLET_HERO_IMAGE_URL,
  );
  const [buttons, setButtons] = React.useState<VooneTemplateButton[]>(
    template?.buttons ??
      DEFAULT_WALLET_BUTTONS.map((button) => ({ ...button })),
  );
  const [textModules, setTextModules] = React.useState<
    VooneTemplateTextModule[]
  >(
    template?.textModules ??
      DEFAULT_WALLET_TEXT_MODULES.map((module) => ({ ...module })),
  );
  const [colors, setColors] = React.useState([
    template?.hexBackgroundColor ??
      selectedPreset?.hexBackgroundColor ??
      DEFAULT_WALLET_BACKGROUND_COLOR,
    "#201715",
    "#b98a4f",
  ]);
  const [saved, setSaved] = React.useState(false);
  const [wallet, setWallet] = React.useState<"apple" | "google">("apple");
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e8cf9a]">
              Live preview
            </p>
            <div role="tablist" aria-label="Wallet" className="flex rounded-full bg-white/10 p-0.5 text-xs font-semibold">
              {(["apple", "google"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={wallet === item}
                  onClick={() => setWallet(item)}
                  className={`rounded-full px-3 py-1 ${wallet === item ? "bg-[#fff8f2] text-[#201715]" : "text-[#dbcac1]"}`}
                >
                  {item === "apple" ? "Apple Wallet" : "Google Wallet"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <TemplatePassPreview
              wallet={wallet}
              option={{
                id: "preview",
                href: "#",
                name: designName,
                programName: name,
                color: colors[0],
                pointsLabel,
                tierLabel,
                detail: description,
                logoUrl,
                heroImageUrl,
              }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-[#dbcac1]">
            {wallet === "apple"
              ? "Apple shows the logo top left and the hero image as a strip behind the points. The strip is cropped to a wide, short shape."
              : "Google shows the logo in a circle and the hero image as a wide banner. It also shows the message below."}
          </p>
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
            <EditorField label="Logo URL" hint="Shown on Apple and Google. Use a square or wide PNG with a transparent background. Apple fits it into 160 × 50.">
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
            <EditorField label="Hero image URL" hint="Google shows it as a banner (1032 × 336). Apple crops it to a strip (375 × 98), so keep the subject in the middle.">
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      {children}
      {hint ? (
        <span className="text-xs font-normal leading-5 text-[#806d63]">{hint}</span>
      ) : null}
    </label>
  );
}

function TemplatePassPreview({
  option,
  compact = false,
  wallet,
}: {
  option: DesignOption;
  compact?: boolean;
  /** Present in the editor, where the two wallets draw the same template differently. */
  wallet?: "apple" | "google";
}) {
  const normalizedColor = option.color.toLowerCase();
  const isDark = ["#30221f", "#2a2e35", "#2f343a"].includes(normalizedColor);
  const ink = isDark ? "#fff8f2" : "#2e2421";
  const [broken, setBroken] = React.useState<string | null>(null);
  const logo = option.logoUrl && broken !== option.logoUrl ? option.logoUrl : null;
  const hero = option.heroImageUrl && broken !== option.heroImageUrl ? option.heroImageUrl : null;

  if (wallet === "apple") {
    return (
      <div
        className="relative overflow-hidden rounded-[18px] border border-white/45 shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
        style={{ backgroundColor: option.color, color: ink }}
      >
        <div className="flex items-center gap-3 p-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" onError={() => setBroken(logo)} className="h-[50px] max-w-[160px] object-contain" />
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE</p>
          )}
          <p className="ml-auto text-right text-[10px] font-semibold uppercase opacity-70">
            {option.tierLabel}
          </p>
        </div>
        <div className="relative flex aspect-[375/98] items-end bg-black/10 px-4 pb-2">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" onError={() => setBroken(hero)} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="relative">
            <p className="text-[9px] uppercase opacity-80">{option.pointsLabel}</p>
            <p className="text-2xl font-semibold leading-none">1,250</p>
          </div>
        </div>
        <div className="grid place-items-center p-4">
          <div className="h-24 w-24 rounded-md bg-white/90" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (wallet === "google") {
    return (
      <div className="overflow-hidden rounded-[18px] border border-white/45 shadow-[0_16px_32px_rgba(0,0,0,0.16)]" style={{ backgroundColor: option.color, color: ink }}>
        <div className="flex items-center gap-3 p-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" onError={() => setBroken(logo)} className="h-9 w-9 rounded-full bg-white/80 object-contain" />
          ) : (
            <span className="h-9 w-9 rounded-full bg-white/60" aria-hidden="true" />
          )}
          <p className="font-serif text-base font-semibold tracking-wide">{option.programName}</p>
        </div>
        <div className="px-4">
          <p className="text-[9px] uppercase opacity-80">{option.pointsLabel}</p>
          <p className="text-2xl font-semibold leading-none">1,250</p>
        </div>
        <div className="mt-4 aspect-[1032/336] bg-black/10">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" onError={() => setBroken(hero)} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="grid place-items-center p-4">
          <div className="h-24 w-24 rounded-md bg-white/90" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-white/45 p-4 shadow-[0_16px_32px_rgba(0,0,0,0.16)] ${compact ? "min-h-52" : "min-h-72"}`}
      style={{
        backgroundColor: option.color,
        color: isDark ? "#fff8f2" : "#2e2421",
      }}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
      {option.heroImageUrl ? (
        <div
          className="absolute inset-x-0 bottom-0 h-20 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(48,34,31,0), rgba(48,34,31,0.7)), url(${option.heroImageUrl})`,
          }}
        />
      ) : null}
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
