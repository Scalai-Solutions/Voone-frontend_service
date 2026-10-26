"use client";

/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CreditCard, Eye, Paintbrush } from "lucide-react";
import { z } from "zod";

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
import { cn } from "@/lib/utils";

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

const treatmentSchema = z.object({ name: z.string().trim().min(1, "Añade un tratamiento").max(120), priceEuro: z.number().optional(), pointsAllotted: z.number().int().min(0) });

type TreatmentValue = z.infer<typeof treatmentSchema>;

const designFields = {
  presetId: z.string().min(1, "Selecciona un diseño inicial"),
  programName: z.string().trim().min(2, "Añade el nombre del programa").max(120, "Máximo 120 caracteres"),
  hexBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color hexadecimal válido"),
  logoUrl: optionalUrlSchema,
  logoOnDarkUrl: optionalUrlSchema,
  heroImageUrl: optionalUrlSchema,
  pointsLabel: z.string().trim().min(2, "Añade la etiqueta de puntos").max(80, "Máximo 80 caracteres"),
  tierLabel: z.string().trim().min(2, "Añade la etiqueta de nivel").max(80, "Máximo 80 caracteres"),
  benefitsText: z.string().trim().min(8, "Añade un mensaje breve de beneficios").max(1200, "Máximo 1200 caracteres"),
  infoText: z.string().trim().min(8, "Añade un mensaje breve de información").max(1200, "Máximo 1200 caracteres"),
};

// A new design starts with a treatment, so it is validated. An existing design's treatments are
// managed in My center and not shown here, so an error about them would have no field to sit on.
const createSchema = z.object({ ...designFields, treatments: z.array(treatmentSchema).min(1, "Añade al menos un tratamiento") });
const updateSchema = z.object({ ...designFields, treatments: z.array(z.custom<TreatmentValue>()) });

type TemplateFormValues = z.infer<typeof createSchema>;
type TemplateTab = "edit" | "preview";

const templateTabs: Array<{ id: TemplateTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "edit", label: "Diseño", icon: Paintbrush },
  { id: "preview", label: "Vista previa", icon: Eye },
];

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
  const [activeTab, setActiveTab] = React.useState<TemplateTab>("edit");
  const [heroWarning, setHeroWarning] = React.useState<string | null>(null);
  const [heroUnchecked, setHeroUnchecked] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  // True while the person is asked to confirm how many cards a save reaches.
  const [confirming, setConfirming] = React.useState(false);
  const [polling, setPolling] = React.useState<RefreshPolling | null>(null);
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(initialTemplate ? updateSchema : createSchema), defaultValues: toFormValues(initialTemplate, initialPreset) });

  // Saving the design must not rewrite the catalogue. Treatments are edited in My center, not here,
  // so they go along only when this form creates the template (with its starter treatment).
  const saveInput = (input: TemplateFormValues): SaveTemplateInput =>
    initialTemplate ? { ...input, treatments: undefined } : input;
  const values = form.watch();

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

  return (
    <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-[1120px] space-y-3">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[#e2d5cc] bg-white/70 p-1">
        {templateTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition", activeTab === tab.id ? "bg-[#2d211e] text-white shadow-sm" : "text-[#806b60] hover:bg-[#f4e9df]")}> 
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "edit" ? (
        <section className="grid gap-4 rounded-3xl border border-[#e2d5cc] bg-white/82 p-4 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Diseño de la tarjeta</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Diseño y contenido</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {availablePresets.map((preset) => (
                <button key={preset.id} type="button" className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left transition", preset.id === values.presetId ? "border-[#a47845] bg-[#fff8ed] shadow-sm" : "border-[#ded1c8] bg-white/70 hover:border-[#c8a36a]")} onClick={() => selectPreset(preset)}>
                  <span className="h-8 w-8 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: preset.hexBackgroundColor }} />
                  <span className="text-sm font-semibold">{preset.name}</span>
                </button>
              ))}
            </div>
            {form.formState.errors.presetId?.message ? <p className="mt-2 text-sm text-destructive">{form.formState.errors.presetId.message}</p> : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Nombre del programa" error={form.formState.errors.programName?.message}>
                <Input {...form.register("programName")} placeholder="Nombre del programa" />
              </Field>
              <Field label="Color de fondo" error={form.formState.errors.hexBackgroundColor?.message} htmlFor="template-background-color">
                <div className="flex h-10 items-center gap-3 rounded-xl border border-[#ded1c8] bg-white px-3 shadow-sm">
                  <input id="template-background-color" type="color" className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0" value={values.hexBackgroundColor} onChange={(event) => form.setValue("hexBackgroundColor", event.target.value, { shouldDirty: true, shouldValidate: true })} />
                  <input type="hidden" {...form.register("hexBackgroundColor")} />
                  <span className="text-sm text-[#806d63]">{values.hexBackgroundColor}</span>
                </div>
              </Field>
              <Field label="URL del logo" error={form.formState.errors.logoUrl?.message}>
                <Input {...form.register("logoUrl")} placeholder="https://..." />
                {!values.logoUrl?.trim() ? <p className="mt-2 text-xs text-[#927e72]">Añade el logo de tu centro; sin él la tarjeta usa el logo de Voone.</p> : null}
              </Field>
              <Field label="Logo para fondo oscuro (opcional, solo Apple Wallet)" error={form.formState.errors.logoOnDarkUrl?.message}>
                <Input {...form.register("logoOnDarkUrl")} placeholder="https://..." />
              </Field>
              <Field label="URL de imagen principal" error={form.formState.errors.heroImageUrl?.message} className="sm:col-span-2">
                <Input {...form.register("heroImageUrl")} placeholder="https://..." />
                {heroWarning ? <p className="mt-2 flex items-start gap-2 rounded-md bg-[#fff7e7] p-3 text-sm text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{heroWarning}</p> : null}
                {heroUnchecked ? <p className="mt-2 text-xs text-[#927e72]">No se pudo comprobar este enlace.</p> : null}
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Texto Wallet</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Etiqueta de puntos" error={form.formState.errors.pointsLabel?.message}>
                <Input {...form.register("pointsLabel")} placeholder="Puntos" />
              </Field>
              <Field label="Etiqueta de nivel" error={form.formState.errors.tierLabel?.message}>
                <Input {...form.register("tierLabel")} placeholder="Nivel" />
              </Field>
              <Field label="Beneficios" error={form.formState.errors.benefitsText?.message} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <Textarea rows={2} className="min-h-16" {...form.register("benefitsText")} placeholder="Reservas prioritarias, ofertas para miembros, crédito de cumpleaños." />
              </Field>
              <Field label="Texto informativo" error={form.formState.errors.infoText?.message} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <Textarea rows={2} className="min-h-16" {...form.register("infoText")} placeholder="Muestra este pase en recepción antes de pagar." />
              </Field>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "preview" ? (
        <section className="grid gap-4 rounded-3xl border border-[#e2d5cc] bg-white/82 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Vista previa</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Así verá el cliente el pase</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#927e72]">Esta pestaña solo previsualiza el pase. Los cambios de contenido van en Diseño y los tratamientos y sus puntos se gestionan en Mi centro.</p>
            <div className="mt-5 max-w-[360px]">
              <WalletCardPreview
                clinicName={currentClinic.data?.name}
                programName={values.programName}
                color={values.hexBackgroundColor}
                logoUrl={values.logoUrl}
                heroImageUrl={values.heroImageUrl}
                levelLabel={values.tierLabel}
                pointsLabel={values.pointsLabel}
              />
              <p className="mt-4 text-xs leading-5 text-[#806e66]"><span className="font-semibold text-[#2e2421]">Beneficios:</span> {values.benefitsText || "Los beneficios aparecerán aquí."}</p>
            </div>
          </div>
          <div className="rounded-3xl bg-[#2d211e] p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">Proveedor</p><h3 className="mt-2 font-serif text-2xl font-semibold">Google Wallet</h3></div>
              <CreditCard className="h-6 w-6 text-[#e8cf9a]" />
            </div>
            <div className="mt-5 rounded-2xl bg-[#f8f0ea] p-4 text-[#2e2421]">
              <p className="font-semibold">{values.programName || "Nombre del programa"}</p>
              <p className="mt-2 text-sm text-[#806e66]">{values.infoText || "El texto informativo aparecerá aquí."}</p>
            </div>
          </div>
        </section>
      ) : null}

      {confirming ? (
        <section role="alertdialog" aria-labelledby="template-confirm-title" className="rounded-3xl border border-[#d9b98f] bg-[#fff8ed] p-4">
          <p id="template-confirm-title" className="font-semibold text-[#2e2421]">
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" className="rounded-2xl" disabled={mutation.isPending} onClick={() => void form.handleSubmit((input) => save(saveInput(input)), () => setConfirming(false))()}>Guardar y actualizar</Button>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setConfirming(false)}>Cancelar</Button>
          </div>
        </section>
      ) : null}

      {statusEnabled && (lastChange || showProgress) ? (
        <section className="rounded-3xl border border-[#e2d5cc] bg-white/82 p-3 text-sm">
          {lastChange && lastChangeTime ? (
            <p className="text-[#806e66]">Último cambio: {lastChange.by ? `${lastChange.by} · ${lastChangeTime}` : lastChangeTime}</p>
          ) : null}
          {showProgress && status && lastChange ? (
            <>
              <p className="mt-1 font-semibold text-[#2e2421]">
                {status.syncedSince.toLocaleString("es-ES")} de {lastChange.cardsAtSave.toLocaleString("es-ES")} tarjetas actualizadas en el servidor
              </p>
              {status.failedSince > 0 ? (
                <p className="mt-1 text-destructive">
                  {status.failedSince === 1 ? "1 tarjeta con error" : `${status.failedSince.toLocaleString("es-ES")} tarjetas con error`}: se reintentarán al guardar de nuevo.
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#e2d5cc] bg-white/82 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm">
            {statusMessage ? <span className={mutation.isError ? "text-destructive" : "inline-flex items-center gap-2 text-success"}>{!mutation.isError ? <CheckCircle2 className="h-4 w-4" /> : null}{statusMessage}</span> : <span className="text-[#927e72]">Los cambios se guardan y llegan a las tarjetas que ya tienen tus clientes.</span>}
          </div>
          <Button type="submit" className="h-10 rounded-2xl px-6" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : initialTemplate ? "Actualizar diseño" : "Crear diseño"}
          </Button>
        </div>
      </section>
    </form>
  );
}
