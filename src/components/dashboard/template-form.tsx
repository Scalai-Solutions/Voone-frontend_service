"use client";

/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Plus, X } from "lucide-react";
import { z } from "zod";

import { GoogleWalletCardPreview } from "@/components/shared/google-wallet-card-preview";
import { ImageUploadButton } from "@/components/shared/image-upload-button";
import { WalletCardPreview } from "@/components/shared/wallet-card-preview";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { useSaveTemplate } from "@/features/templates/api/useSaveTemplate";
import { useTemplateRefreshStatus, type RefreshPolling } from "@/features/templates/api/useTemplateRefreshStatus";
import { useTemplatePresets } from "@/features/templates/api/useTemplatePresets";
import { ApiError, type SaveTemplateInput, type Template, type TemplatePreset } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { chooseLogoUrl } from "@/lib/logo-choice";
import { cn } from "@/lib/utils";
import { WALLET_TEXT_MAX, WALLET_TEXT_MAX_MESSAGE, clampChars, countChars } from "@/lib/wallet-text";
import { CharCounter } from "@/components/shared/char-counter";

// One URL and nothing else: a pasted line such as "foto.jpg  logo  https://..." is rejected here
// instead of being sent to Google Wallet, which refuses it.
const optionalUrlSchema = z
  .string()
  .trim()
  .url("Usa una URL válida")
  .max(2048)
  .refine((value) => !/\s/.test(value), "Pon solo una URL, sin espacios ni texto extra")
  .optional()
  .or(z.literal(""));

const requiredUrlSchema = z
  .string()
  .trim()
  .url("Usa una URL válida")
  .max(2048)
  .refine((value) => !/\s/.test(value), "Pon solo una URL, sin espacios ni texto extra");

/** Same cap as the backend's CARD_EXTRA_BUTTONS_MAX. */
const EXTRA_BUTTONS_MAX = 5;

// Counted like the backend (code points), on the raw text, so what the counter shows is what is checked.
const walletText = (emptyMessage: string) =>
  z
    .string()
    .refine((value) => countChars(value) <= WALLET_TEXT_MAX, WALLET_TEXT_MAX_MESSAGE)
    .refine((value) => value.trim().length >= 8, emptyMessage);

const treatmentSchema = z.object({ name: z.string().trim().min(1, "Añade un tratamiento").max(120), priceEuro: z.number().optional(), pointsAllotted: z.number().int().min(0) });

type TreatmentValue = z.infer<typeof treatmentSchema>;

const designFields = {
  presetId: z.string().min(1, "Selecciona un diseño inicial"),
  programName: z.string().trim().min(2, "Añade el nombre del programa").max(120, "Máximo 120 caracteres"),
  hexBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color hexadecimal válido"),
  logoUrl: optionalUrlSchema,
  logoOnDarkUrl: optionalUrlSchema,
  heroImageUrl: optionalUrlSchema,
  websiteUrl: optionalUrlSchema,
  appointmentUrl: optionalUrlSchema,
  appLinkText: z.string().trim().max(30, "Máximo 30 caracteres"),
  extraButtons: z
    .array(z.object({ label: z.string().trim().min(1, "Añade el texto del botón").max(30, "Máximo 30 caracteres"), url: requiredUrlSchema }))
    .max(EXTRA_BUTTONS_MAX, `Hasta ${EXTRA_BUTTONS_MAX} botones adicionales`),
  pointsLabel: z.string().trim().min(2, "Añade la etiqueta de puntos").max(80, "Máximo 80 caracteres"),
  tierLabel: z.string().trim().min(2, "Añade la etiqueta de nivel").max(80, "Máximo 80 caracteres"),
  benefitsText: walletText("Añade un mensaje breve de beneficios"),
  infoText: walletText("Añade un mensaje breve de información"),
};

// A new design starts with a treatment, so it is validated. An existing design's treatments are
// managed in My center and not shown here, so an error about them would have no field to sit on.
const createSchema = z.object({ ...designFields, treatments: z.array(treatmentSchema).min(1, "Añade al menos un tratamiento") });
const updateSchema = z.object({ ...designFields, treatments: z.array(z.custom<TreatmentValue>()) });

// With a live programme the Beneficios field is not shown, so its "at least 8 characters" rule has no
// field to sit on and must not block saving. The length cap stays: the stored text is still sent.
const updateSchemaWithProgramme = z.object({
  ...designFields,
  benefitsText: z.string().refine((value) => countChars(value) <= WALLET_TEXT_MAX, WALLET_TEXT_MAX_MESSAGE),
  treatments: z.array(z.custom<TreatmentValue>()),
});

type TemplateFormValues = z.infer<typeof createSchema>;
type PreviewWallet = "google" | "apple";

const POLL_WINDOW_MS = 60_000;

const formatChangeTime = (iso: string) => {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
};

const emptyValues: TemplateFormValues = {
  presetId: "",
  programName: "",
  hexBackgroundColor: "#ead0bd",
  logoUrl: "",
  logoOnDarkUrl: "",
  heroImageUrl: "",
  websiteUrl: "",
  appointmentUrl: "",
  appLinkText: "",
  extraButtons: [],
  pointsLabel: "Puntos",
  tierLabel: "Nivel",
  benefitsText: "",
  infoText: "",
  treatments: [{ name: "Consulta", pointsAllotted: 60 }],
};

function toFormValues(template: Template | undefined, selectedPreset: TemplatePreset | undefined): TemplateFormValues {
  if (!template) {
    return {
      ...emptyValues,
      presetId: selectedPreset?.id ?? "",
      programName: selectedPreset ? `${selectedPreset.name} Club` : "",
      hexBackgroundColor: selectedPreset?.hexBackgroundColor ?? emptyValues.hexBackgroundColor,
    };
  }

  return {
    presetId: template.presetId ?? template.preset?.id ?? selectedPreset?.id ?? "",
    programName: template.programName,
    hexBackgroundColor: template.hexBackgroundColor,
    logoUrl: template.logoUrl ?? "",
    logoOnDarkUrl: template.logoOnDarkUrl ?? "",
    heroImageUrl: template.heroImageUrl ?? "",
    websiteUrl: template.websiteUrl ?? "",
    appointmentUrl: template.appointmentUrl ?? "",
    appLinkText: template.appLinkText ?? "",
    extraButtons: template.extraButtons ?? [],
    pointsLabel: template.pointsLabel,
    tierLabel: template.tierLabel,
    benefitsText: template.benefitsText,
    infoText: template.infoText,
    // The price is carried through so editing a treatment here does not erase it. A missing price is
    // dropped rather than sent as null, which the backend would read as zero.
    treatments: template.treatments?.length
      ? template.treatments.map((treatment) => ({
          name: treatment.name,
          pointsAllotted: treatment.pointsAllotted,
          ...(typeof treatment.priceEuro === "number" ? { priceEuro: treatment.priceEuro } : {}),
        }))
      : emptyValues.treatments,
  };
}

function luminance(hex: string) {
  const clean = hex.replace("#", "");
  const values = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = values.map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * "clinic" saves for the signed-in clinic's own session. "admin" is a Voone administrator editing a
 * chosen clinic's card, and saves through the admin route with that clinic's id.
 */
export function TemplateForm({ clinicId, initialTemplate, presets, selectedPresetId, scope = "clinic" }: { clinicId: string; initialTemplate?: Template; presets: TemplatePreset[]; selectedPresetId?: string; scope?: "clinic" | "admin" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentClinic = useCurrentClinic({ enabled: scope === "clinic" });
  const presetsQuery = useTemplatePresets({ initialData: presets });
  const availablePresets = presetsQuery.data ?? presets;
  const initialPreset = presets.find((preset) => preset.id === (initialTemplate?.presetId ?? selectedPresetId));
  const [previewWallet, setPreviewWallet] = React.useState<PreviewWallet>("google");
  const [heroWarning, setHeroWarning] = React.useState<string | null>(null);
  const [heroUnchecked, setHeroUnchecked] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  // True while the person is asked to confirm how many cards a save reaches.
  const [confirming, setConfirming] = React.useState(false);
  const [polling, setPolling] = React.useState<RefreshPolling | null>(null);
  // A clinic with a live programme shows each client their tier's benefits, so the typed text is only a
  // fallback and is not offered. Its value stays in form state, so a save still submits it unchanged.
  const hasActiveProgramme = initialTemplate?.hasActiveProgramme === true;
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(initialTemplate ? (hasActiveProgramme ? updateSchemaWithProgramme : updateSchema) : createSchema), defaultValues: toFormValues(initialTemplate, initialPreset) });

  // Saving the design must not rewrite the catalogue. Treatments are edited in My center, not here,
  // so they go along only when this form creates the template (with its starter treatment).
  // The button fields are always sent: the backend stores a missing optional URL as null, so
  // leaving them out would erase the card's buttons. The description mirrors the text, as onboarding does.
  const saveInput = (input: TemplateFormValues): SaveTemplateInput => {
    const withButtons = { ...input, appLinkDescription: input.appLinkText };

    return initialTemplate ? { ...withButtons, treatments: undefined } : withButtons;
  };
  const extraButtons = useFieldArray({ control: form.control, name: "extraButtons" });
  const values = form.watch();

  // Registers a text field that cannot grow past the backend cap. Counting in code points, a native
  // maxLength (UTF-16 units) would stop emoji text early while the counter still showed room.
  const limitedRegister = (name: "benefitsText" | "infoText") => {
    const field = form.register(name);

    return {
      ...field,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        event.target.value = clampChars(event.target.value);
        return field.onChange(event);
      },
    };
  };

  // Only the centre's own session can read its card status; the admin route has no such view.
  const statusEnabled = scope === "clinic" && Boolean(initialTemplate);
  const refreshStatus = useTemplateRefreshStatus({ enabled: statusEnabled, polling });
  const status = refreshStatus.data;
  const lastChange = status?.lastChange ?? null;
  const lastChangeTime = lastChange ? formatChangeTime(lastChange.at) : null;
  // Progress is shown only for the change just saved, never for an older one.
  const showProgress = Boolean(polling && lastChange && lastChange.at !== polling.previousChangeAt && lastChange.cardsAtSave > 0);

  // Reads the hero image from the URL the user typed and warns when it is too close to the card
  // colour. A link that cannot be read (blocked by CORS, broken, not an image) is not an error:
  // the form says it could not be checked and the image is still saved.
  const heroUrl = (values.heroImageUrl ?? "").trim();
  const backgroundColor = values.hexBackgroundColor;
  React.useEffect(() => {
    let cancelled = false;
    let image: HTMLImageElement | null = null;
    const finish = (warning: string | null, unchecked: boolean) => {
      if (cancelled) return;
      setHeroWarning(warning);
      setHeroUnchecked(unchecked);
    };
    const timer = window.setTimeout(() => {
      if (!heroUrl) return finish(null, false);

      let parsed: URL;
      try {
        parsed = new URL(heroUrl);
      } catch {
        return finish(null, false);
      }
      if (!/^https?:$/.test(parsed.protocol) || /\s/.test(heroUrl)) return finish(null, false);

      image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 32;
          canvas.height = 32;
          const context = canvas.getContext("2d");
          if (!context || !image) return finish(null, true);
          context.drawImage(image, 0, 0, 32, 32);
          // Throws when the canvas is tainted, that is, when the server sent no CORS headers.
          const pixels = context.getImageData(0, 0, 32, 32).data;
          let total = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            total += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (3 * 255);
          }
          const imageLuminance = total / (pixels.length / 4);
          const tooClose = Math.abs(imageLuminance - luminance(backgroundColor)) < 0.22;
          finish(tooClose ? "Esta imagen se parece demasiado al color del pase. Elige una imagen con más contraste o ajusta el fondo." : null, false);
        } catch {
          finish(null, true);
        }
      };
      image.onerror = () => finish(null, true);
      image.src = heroUrl;
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (image) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [heroUrl, backgroundColor]);

  const mutation = useSaveTemplate(initialTemplate?.id, clinicId, scope, {
    onSuccess: (template) => {
      setStatusMessage("Diseño de la tarjeta guardado.");
      setPolling((current) => ({ until: Date.now() + POLL_WINDOW_MS, previousChangeAt: current?.previousChangeAt ?? null }));

      if (!initialTemplate) {
        router.replace(`/dashboard/templates/${template.id}`);
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setStatusMessage("Este centro ya tiene un diseño de tarjeta: edítalo en lugar de crear otro.");
        queryClient.invalidateQueries({ queryKey: queryKeys.clinicTemplate(clinicId) });
        window.setTimeout(() => router.replace(scope === "admin" ? `/admin/clinics/${clinicId}` : "/dashboard/templates"), 1200);
        return;
      }

      // The backend refuses these two texts above its cap with a 422; show that on the field itself.
      if (error instanceof ApiError && error.status === 422 && /\b500\b/.test(error.detail ?? "")) {
        const message = error.detail ?? WALLET_TEXT_MAX_MESSAGE;
        const over = (["benefitsText", "infoText"] as const).filter((name) => countChars(form.getValues(name)) > WALLET_TEXT_MAX);
        // The API does not say which text it meant, so a text under the cap is never blamed.
        (over.length ? over : (["benefitsText", "infoText"] as const)).forEach((name) => form.setError(name, { type: "server", message }));
        setStatusMessage(message);
        return;
      }

      setStatusMessage("No se pudo guardar. Inténtalo de nuevo o revisa la conexión con la API.");
    },
  });

  function save(input: SaveTemplateInput) {
    setConfirming(false);
    setStatusMessage(null);
    // Remember what the last change was, so the progress that follows is for this one.
    setPolling({ until: 0, previousChangeAt: lastChange?.at ?? null });
    mutation.mutate(input);
  }

  // Changing an existing design reaches cards that are already out, so it is confirmed first.
  function submit(input: TemplateFormValues) {
    if (statusEnabled) {
      void refreshStatus.refetch();
      setConfirming(true);
      return;
    }

    save(saveInput(input));
  }

  function selectPreset(preset: TemplatePreset) {
    form.setValue("presetId", preset.id, { shouldDirty: true, shouldValidate: true });
    form.setValue("hexBackgroundColor", preset.hexBackgroundColor, { shouldDirty: true, shouldValidate: true });

    if (!form.getValues("programName")) {
      form.setValue("programName", `${preset.name} Club`, { shouldDirty: true, shouldValidate: true });
    }
  }

  const errors = form.formState.errors;
  const previewLogo = chooseLogoUrl({ logoUrl: values.logoUrl, logoOnDarkUrl: values.logoOnDarkUrl, color: values.hexBackgroundColor });

  return (
    <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-[1180px]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-5">
          <Section title="Estilo" description="Elige un punto de partida y ajusta el color.">
            <div className="flex flex-wrap gap-2">
              {availablePresets.map((preset) => {
                const selected = preset.id === values.presetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-medium transition",
                      selected ? "border-[#2d211e] bg-[#2d211e] text-white shadow-sm" : "border-[#e2d5cc] bg-white text-[#4a3a33] hover:border-[#c8a36a]",
                    )}
                  >
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: preset.hexBackgroundColor }} />
                    {preset.name}
                  </button>
                );
              })}
            </div>
            {errors.presetId?.message ? <p className="text-sm text-destructive">{errors.presetId.message}</p> : null}
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Field label="Nombre del programa" error={errors.programName?.message}>
                <Input {...form.register("programName")} placeholder="Club Diamante" />
              </Field>
              <Field label="Color de la tarjeta" error={errors.hexBackgroundColor?.message} htmlFor="template-background-color">
                <label className="flex h-10 cursor-pointer items-center gap-3 rounded-xl border border-[#ded1c8] bg-white px-2 shadow-sm">
                  <input id="template-background-color" type="color" className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" value={values.hexBackgroundColor} onChange={(event) => form.setValue("hexBackgroundColor", event.target.value, { shouldDirty: true, shouldValidate: true })} />
                  <input type="hidden" {...form.register("hexBackgroundColor")} />
                  <span className="font-mono text-sm uppercase text-[#806d63]">{values.hexBackgroundColor}</span>
                </label>
              </Field>
            </div>
          </Section>

          <Section title="Imágenes" description="Sube un archivo o pega un enlace.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo" error={errors.logoUrl?.message} htmlFor="template-logo-url">
                <Input id="template-logo-url" aria-describedby={errors.logoUrl ? "template-logo-url-error" : undefined} aria-invalid={errors.logoUrl ? true : undefined} {...form.register("logoUrl")} placeholder="https://..." />
                <ImageUploadButton kind="logo" scope={scope} disabled={mutation.isPending} labels={{ ariaLabel: "Subir imagen del logo" }} onUploaded={(url) => form.setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })} />
              </Field>
              <Field label="Logo para fondo oscuro (opcional)" error={errors.logoOnDarkUrl?.message} htmlFor="template-logo-on-dark-url">
                <Input id="template-logo-on-dark-url" aria-describedby={errors.logoOnDarkUrl ? "template-logo-on-dark-url-error" : undefined} aria-invalid={errors.logoOnDarkUrl ? true : undefined} {...form.register("logoOnDarkUrl")} placeholder="https://..." />
                <ImageUploadButton kind="logoOnDark" scope={scope} disabled={mutation.isPending} labels={{ ariaLabel: "Subir imagen del logo para fondo oscuro" }} onUploaded={(url) => form.setValue("logoOnDarkUrl", url, { shouldDirty: true, shouldValidate: true })} />
              </Field>
              <Field label="Imagen principal (opcional)" error={errors.heroImageUrl?.message} className="sm:col-span-2" htmlFor="template-hero-image-url">
                <Input id="template-hero-image-url" aria-describedby={errors.heroImageUrl ? "template-hero-image-url-error" : undefined} aria-invalid={errors.heroImageUrl ? true : undefined} {...form.register("heroImageUrl")} placeholder="https://..." />
                <ImageUploadButton kind="hero" scope={scope} disabled={mutation.isPending} labels={{ ariaLabel: "Subir imagen principal" }} onUploaded={(url) => form.setValue("heroImageUrl", url, { shouldDirty: true, shouldValidate: true })} />
                {heroWarning ? <p className="mt-2 flex items-start gap-2 rounded-xl bg-[#fff7e7] p-3 text-sm text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{heroWarning}</p> : null}
                {heroUnchecked ? <p className="mt-2 text-xs text-[#927e72]">No se pudo comprobar este enlace.</p> : null}
              </Field>
            </div>
          </Section>

          <Section title="Botones" description="El botón principal va en la parte frontal; los secundarios, en el reverso de la tarjeta.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texto del botón principal" error={errors.appLinkText?.message}>
                <Input {...form.register("appLinkText")} maxLength={30} placeholder="Sitio web" />
              </Field>
              <Field label="Enlace del botón principal" error={errors.appointmentUrl?.message}>
                <Input {...form.register("appointmentUrl")} placeholder="https://..." />
              </Field>
            </div>

            <div className="space-y-3 border-t border-[#f0e6df] pt-4">
              <p className="text-sm font-semibold text-[#2e2421]">Botones secundarios</p>
              <Field label="Página web (opcional)" error={errors.websiteUrl?.message}>
                <Input {...form.register("websiteUrl")} placeholder="https://..." />
              </Field>
              {extraButtons.fields.map((button, index) => (
                <div key={button.id} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                  <Field label={`Texto del botón ${index + 1}`} error={errors.extraButtons?.[index]?.label?.message}>
                    <Input {...form.register(`extraButtons.${index}.label`)} maxLength={30} placeholder="Reservar cita" />
                  </Field>
                  <Field label={`Enlace del botón ${index + 1}`} error={errors.extraButtons?.[index]?.url?.message}>
                    <Input {...form.register(`extraButtons.${index}.url`)} placeholder="https://..." />
                  </Field>
                  <button type="button" onClick={() => extraButtons.remove(index)} aria-label={`Quitar botón ${index + 1}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#a08b80] transition hover:bg-[#fff3f1] hover:text-[#b94135]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {extraButtons.fields.length < EXTRA_BUTTONS_MAX ? (
                <button
                  type="button"
                  onClick={() => extraButtons.append({ label: "", url: "" })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#cdb9aa] px-3 py-2 text-sm font-semibold text-[#6f4d3f] transition hover:border-[#a47845] hover:bg-[#fffaf6]"
                >
                  <Plus className="h-4 w-4" /> Añadir botón secundario
                </button>
              ) : null}
            </div>
          </Section>

          <Section title="Textos de la tarjeta">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Etiqueta de puntos" error={errors.pointsLabel?.message}>
                <Input {...form.register("pointsLabel")} placeholder="Puntos" />
              </Field>
              <Field label="Etiqueta de nivel" error={errors.tierLabel?.message}>
                <Input {...form.register("tierLabel")} placeholder="Nivel" />
              </Field>
              {hasActiveProgramme ? (
                <div className="sm:col-span-2" data-testid="template-benefits-from-programme">
                  <p className="text-sm font-medium text-[#2e2421]">Beneficios</p>
                  <p className="mt-1 rounded-xl bg-[#faf5f1] p-3 text-xs leading-5 text-[#806e66]">
                    Cada cliente ve los beneficios de su nivel del programa.
                    {scope === "admin" ? (
                      <>
                        {" "}
                        <Link href={`/admin/clinics/${clinicId}/program`} className="font-semibold text-[#b7874a] underline underline-offset-2">Editar en Programa</Link>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <Field label="Beneficios" error={errors.benefitsText?.message} htmlFor="template-benefits-text" className="sm:col-span-2">
                  <Textarea id="template-benefits-text" rows={2} className="min-h-16" aria-invalid={errors.benefitsText ? true : undefined} {...limitedRegister("benefitsText")} placeholder="Reservas prioritarias, ofertas para miembros, crédito de cumpleaños." />
                  <CharCounter text={values.benefitsText ?? ""} />
                </Field>
              )}
              <Field label="Texto informativo" error={errors.infoText?.message} htmlFor="template-info-text" className="sm:col-span-2">
                <Textarea id="template-info-text" rows={2} className="min-h-16" aria-invalid={errors.infoText ? true : undefined} {...limitedRegister("infoText")} placeholder="Muestra este pase en recepción antes de pagar." />
                <CharCounter text={values.infoText ?? ""} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="rounded-3xl border border-[#e2d5cc] bg-gradient-to-b from-[#faf5f1] to-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#2e2421]">Vista previa</p>
              <div className="flex rounded-full bg-[#efe6df] p-0.5 text-xs font-semibold" role="group" aria-label="Wallet de la vista previa">
                {(["google", "apple"] as const).map((wallet) => (
                  <button
                    key={wallet}
                    type="button"
                    aria-pressed={previewWallet === wallet}
                    onClick={() => setPreviewWallet(wallet)}
                    className={cn("rounded-full px-3 py-1 transition", previewWallet === wallet ? "bg-white text-[#2e2421] shadow-sm" : "text-[#806b60] hover:text-[#2e2421]")}
                  >
                    {wallet === "google" ? "Google" : "Apple"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto mt-4 max-w-[340px]">
              {previewWallet === "google" ? (
                // Laid out as the backend builds the Google class, like onboarding step 3.
                <GoogleWalletCardPreview
                  clinicName={currentClinic.data?.name}
                  programName={values.programName}
                  color={values.hexBackgroundColor}
                  logoUrl={previewLogo}
                  heroImageUrl={values.heroImageUrl}
                  levelLabel={values.tierLabel}
                  pointsLabel={values.pointsLabel}
                  programme={hasActiveProgramme}
                  buttonText={values.appointmentUrl?.trim() ? values.appLinkText?.trim() || "Reservar cita" : undefined}
                  hasWebsite={Boolean(values.websiteUrl?.trim())}
                  extraButtons={values.extraButtons ?? []}
                />
              ) : (
                <WalletCardPreview
                  clinicName={currentClinic.data?.name}
                  programName={values.programName}
                  color={values.hexBackgroundColor}
                  logoUrl={previewLogo}
                  heroImageUrl={values.heroImageUrl}
                  levelLabel={values.tierLabel}
                  pointsLabel={values.pointsLabel}
                />
              )}
            </div>
            {!values.logoUrl?.trim() ? <p className="mt-3 text-center text-xs text-[#927e72]">Sin logo, la tarjeta usa el de Voone.</p> : null}
          </div>

          {statusEnabled && (lastChange || showProgress) ? (
            <div className="mt-3 rounded-2xl border border-[#e2d5cc] bg-white p-3 text-xs">
              {lastChange && lastChangeTime ? (
                <p className="text-[#806e66]">Último cambio: {lastChange.by ? `${lastChange.by} · ${lastChangeTime}` : lastChangeTime}</p>
              ) : null}
              {showProgress && status && lastChange ? (
                <>
                  <p className="mt-1 font-semibold text-[#2e2421]">
                    {status.syncedSince.toLocaleString("es-ES")} de {lastChange.cardsAtSave.toLocaleString("es-ES")} tarjetas actualizadas
                  </p>
                  {status.failedSince > 0 ? (
                    <p className="mt-1 text-destructive">
                      {status.failedSince === 1 ? "1 tarjeta con error" : `${status.failedSince.toLocaleString("es-ES")} tarjetas con error`}: se reintentarán al guardar de nuevo.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>

      <div className="sticky bottom-4 z-30 mt-6">
        <div
          role={confirming ? "alertdialog" : undefined}
          aria-labelledby={confirming ? "template-confirm-title" : undefined}
          className={cn("flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_40px_-12px_rgba(67,48,43,0.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between", confirming ? "border-[#d9b98f] bg-[#fff8ed]/95" : "border-[#e2d5cc] bg-white/90")}
        >
          {confirming ? (
            <>
              <p id="template-confirm-title" className="text-sm font-semibold text-[#2e2421]">
                {refreshStatus.isPending
                  ? "Comprobando cuántas tarjetas se actualizarán..."
                  : status
                    ? status.eligible > 0
                      ? status.eligible === 1
                        ? "Se actualizará 1 tarjeta"
                        : `Se actualizarán ${status.eligible.toLocaleString("es-ES")} tarjetas`
                      : "Todavía no hay tarjetas emitidas; el cambio se aplicará a las nuevas."
                    : "No se pudo comprobar cuántas tarjetas se actualizarán."}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirming(false)}>Cancelar</Button>
                <Button type="button" className="rounded-xl px-5" disabled={mutation.isPending} onClick={() => void form.handleSubmit((input) => save(saveInput(input)), () => setConfirming(false))()}>
                  {mutation.isPending ? "Guardando..." : "Guardar y actualizar"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="min-h-5 text-sm" role="status">
                {statusMessage ? (
                  <span className={mutation.isError ? "text-destructive" : "inline-flex items-center gap-2 text-success"}>
                    {!mutation.isError ? <CheckCircle2 className="h-4 w-4" /> : null}
                    {statusMessage}
                  </span>
                ) : null}
              </div>
              <Button type="submit" className="h-10 rounded-xl px-6" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : initialTemplate ? "Guardar cambios" : "Crear diseño"}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#e2d5cc] bg-white p-5 shadow-[0_1px_2px_rgba(67,48,43,0.04)] sm:p-6">
      <h2 className="text-base font-semibold text-[#2e2421]">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-[#927e72]">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
