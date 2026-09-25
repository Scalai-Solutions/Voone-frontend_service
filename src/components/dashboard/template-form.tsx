"use client";

/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Eye, FileText, Info, ListChecks, Paintbrush, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import { useSaveTemplate } from "@/features/templates/api/useSaveTemplate";
import { useTemplatePresets } from "@/features/templates/api/useTemplatePresets";
import { ApiError, type Clinic, type Template, type TemplatePreset } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const optionalUrlSchema = z.string().url("Usa una URL válida").max(2048).optional().or(z.literal(""));

const templateSchema = z.object({
  presetId: z.string().min(1, "Selecciona un diseño inicial"),
  programName: z.string().trim().min(2, "Añade el nombre del programa").max(120, "Máximo 120 caracteres"),
  hexBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color hexadecimal válido"),
  logoUrl: optionalUrlSchema,
  heroImageUrl: optionalUrlSchema,
  pointsLabel: z.string().trim().min(2, "Añade la etiqueta de puntos").max(80, "Máximo 80 caracteres"),
  tierLabel: z.string().trim().min(2, "Añade la etiqueta de nivel").max(80, "Máximo 80 caracteres"),
  benefitsText: z.string().trim().min(8, "Añade un mensaje breve de beneficios").max(1200, "Máximo 1200 caracteres"),
  infoText: z.string().trim().min(8, "Añade un mensaje breve de información").max(1200, "Máximo 1200 caracteres"),
  treatments: z.array(z.object({ name: z.string().trim().min(1, "Añade un tratamiento").max(120), pointsAllotted: z.number().int().min(0) })).min(1, "Añade al menos un tratamiento"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;
type TemplateTab = "edit" | "preview" | "treatments" | "center";

const templateTabs: Array<{ id: TemplateTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "edit", label: "Edit Template", icon: Paintbrush },
  { id: "preview", label: "Live Preview", icon: Eye },
  { id: "treatments", label: "Tratamientos", icon: ListChecks },
  { id: "center", label: "Información del centro", icon: Building2 },
];

const emptyValues: TemplateFormValues = {
  presetId: "",
  programName: "",
  hexBackgroundColor: "#ead0bd",
  logoUrl: "",
  heroImageUrl: "",
  pointsLabel: "Saldo Beauty",
  tierLabel: "Miembro Gold",
  benefitsText: "",
  infoText: "",
  treatments: [{ name: "Consulta", pointsAllotted: 60 }],
};

const ownerEmailFor = (clinic: Clinic) =>
  clinic.users.find((user) => user.role.toUpperCase() === "OWNER")?.email ??
  clinic.users[0]?.email;

const formatNumber = (value: number) => value.toLocaleString("es-ES");

function toClinicDetails(clinic: Clinic | undefined): Array<{ label: string; value: string }> {
  if (!clinic) return [];

  const ownerEmail = ownerEmailFor(clinic);

  return [
    { label: "Nombre comercial", value: clinic.name },
    { label: "Identificador público", value: clinic.slug },
    { label: "Dirección", value: clinic.addressLine },
    { label: "Código postal", value: clinic.pincode },
    ...(ownerEmail ? [{ label: "Email propietario", value: ownerEmail }] : []),
    { label: "Plan", value: clinic.voonePlan },
    { label: "Miembros activos", value: formatNumber(clinic.members) },
    { label: "Plantilla predeterminada", value: clinic.template?.programName ?? "Sin plantilla Wallet" },
    { label: "Aviso de privacidad", value: clinic.privacyPolicyVersion },
  ];
}

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
    heroImageUrl: template.heroImageUrl ?? "",
    pointsLabel: template.pointsLabel,
    tierLabel: template.tierLabel,
    benefitsText: template.benefitsText,
    infoText: template.infoText,
    treatments: template.treatments?.length ? template.treatments : emptyValues.treatments,
  };
}

function luminance(hex: string) {
  const clean = hex.replace("#", "");
  const values = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = values.map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function textColorFor(backgroundColor: string) {
  return luminance(backgroundColor) > 0.45 ? "#2b211c" : "#fff9f2";
}

export function TemplateForm({ clinicId, initialTemplate, presets, selectedPresetId }: { clinicId: string; initialTemplate?: Template; presets: TemplatePreset[]; selectedPresetId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentClinic = useCurrentClinic();
  const presetsQuery = useTemplatePresets({ initialData: presets });
  const availablePresets = presetsQuery.data ?? presets;
  const clinicDetails = React.useMemo(() => toClinicDetails(currentClinic.data), [currentClinic.data]);
  const initialPreset = presets.find((preset) => preset.id === (initialTemplate?.presetId ?? selectedPresetId));
  const [selectedPreset, setSelectedPreset] = React.useState<TemplatePreset | undefined>(initialPreset);
  const [activeTab, setActiveTab] = React.useState<TemplateTab>("edit");
  const [heroWarning, setHeroWarning] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema), defaultValues: toFormValues(initialTemplate, initialPreset) });
  const treatments = useFieldArray({ control: form.control, name: "treatments" });
  const values = form.watch();

  const mutation = useSaveTemplate(initialTemplate?.id, clinicId, {
    onSuccess: (template) => {
      setStatusMessage("Plantilla guardada para los proveedores Wallet disponibles.");

      if (!initialTemplate) {
        router.replace(`/dashboard/templates/${template.id}`);
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setStatusMessage("This clinic already has a template — edit it instead");
        queryClient.invalidateQueries({ queryKey: queryKeys.clinicTemplate(clinicId) });
        window.setTimeout(() => router.replace("/dashboard/templates"), 1200);
        return;
      }

      setStatusMessage("No se pudo guardar. Inténtalo de nuevo o revisa la conexión con la API.");
    },
  });

  function selectPreset(preset: TemplatePreset) {
    setSelectedPreset(preset);
    form.setValue("presetId", preset.id, { shouldDirty: true, shouldValidate: true });
    form.setValue("hexBackgroundColor", preset.hexBackgroundColor, { shouldDirty: true, shouldValidate: true });

    if (!form.getValues("programName")) {
      form.setValue("programName", `${preset.name} Club`, { shouldDirty: true, shouldValidate: true });
    }
  }

  async function checkHeroContrast(file: File | undefined) {
    if (!file) {
      setHeroWarning(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let total = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        total += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (3 * 255);
      }
      const imageLuminance = total / (pixels.length / 4);
      const backgroundLuminance = luminance(values.hexBackgroundColor);
      setHeroWarning(Math.abs(imageLuminance - backgroundLuminance) < 0.22 ? "Esta imagen se parece demasiado al color del pase. Elige una imagen con más contraste o ajusta el fondo." : null);
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  }

  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="mx-auto max-w-[1120px] space-y-3">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Edit Template</p>
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
              </Field>
              <Field label="URL de imagen principal" error={form.formState.errors.heroImageUrl?.message}>
                <Input {...form.register("heroImageUrl")} placeholder="https://..." />
              </Field>
              <Field label="Comprobar contraste" className="sm:col-span-2">
                <Input type="file" accept="image/*" onChange={(event) => checkHeroContrast(event.target.files?.[0])} />
                {heroWarning ? <p className="mt-2 flex items-start gap-2 rounded-md bg-[#fff7e7] p-3 text-sm text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{heroWarning}</p> : null}
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Texto Wallet</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Etiqueta de puntos" error={form.formState.errors.pointsLabel?.message}>
                <Input {...form.register("pointsLabel")} placeholder="Saldo Beauty" />
              </Field>
              <Field label="Etiqueta de nivel" error={form.formState.errors.tierLabel?.message}>
                <Input {...form.register("tierLabel")} placeholder="Miembro Gold" />
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Live Preview</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Así verá el cliente el pase</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#927e72]">Esta pestaña solo previsualiza el pase. Cambios de contenido van en Edit Template y los puntos se gestionan en Tratamientos.</p>
            <div className="mt-5 max-w-[360px]"><PassPreviewCard values={values} presetName={selectedPreset?.name} /></div>
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

      {activeTab === "treatments" ? (
        <section className="rounded-3xl border border-[#e2d5cc] bg-white/82 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Tratamientos</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Puntos por tratamiento</h2>
            </div>
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => treatments.append({ name: "", pointsAllotted: 0 })}>
              <Plus className="mr-2 h-4 w-4" /> Añadir
            </Button>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#eadfd8]">
            {treatments.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 border-b border-[#eadfd8] bg-[#fffaf6] p-3 last:border-b-0 sm:grid-cols-[1fr_140px_auto]">
                <Field label="Tratamiento" error={form.formState.errors.treatments?.[index]?.name?.message}>
                  <Input {...form.register(`treatments.${index}.name`)} placeholder="Hydrafacial" />
                </Field>
                <Field label="Puntos" error={form.formState.errors.treatments?.[index]?.pointsAllotted?.message}>
                  <Input type="number" min={0} {...form.register(`treatments.${index}.pointsAllotted`, { valueAsNumber: true })} />
                </Field>
                <Button type="button" variant="outline" className="self-end rounded-2xl" disabled={treatments.fields.length === 1} onClick={() => treatments.remove(index)} aria-label="Eliminar tratamiento">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {typeof form.formState.errors.treatments?.message === "string" ? <p className="mt-2 text-sm text-destructive">{form.formState.errors.treatments.message}</p> : null}
        </section>
      ) : null}

      {activeTab === "center" ? (
        <section className="rounded-3xl border border-[#e2d5cc] bg-white/82 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Información del centro</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Datos de {currentClinic.data?.name ?? "tu centro"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#927e72]">Esta pestaña muestra la información del negocio que acompaña a las plantillas y enlaces del centro.</p>
            </div>
            <Info className="h-6 w-6 text-[#b8864b]" />
          </div>
          {clinicDetails.length > 0 ? (
            <div className="mt-5 grid gap-x-16 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinicDetails.map((detail) => (
                <div key={detail.label}>
                  <p className="text-xs text-[#927e72]">{detail.label}</p>
                  <p className="mt-1 font-semibold">{detail.value}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-sm text-[#927e72]">Cargando la información guardada durante el onboarding...</p>}
          <Link href="/dashboard/settings" className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"><FileText className="h-4 w-4" /> Editar información completa</Link>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[#e2d5cc] bg-white/82 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm">
            {statusMessage ? <span className={mutation.isError ? "text-destructive" : "inline-flex items-center gap-2 text-success"}>{!mutation.isError ? <CheckCircle2 className="h-4 w-4" /> : null}{statusMessage}</span> : <span className="text-[#927e72]">Los cambios se guardan en la plantilla Wallet de la clínica.</span>}
          </div>
          <Button type="submit" className="h-10 rounded-2xl px-6" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : initialTemplate ? "Actualizar plantilla" : "Crear plantilla"}
          </Button>
        </div>
      </section>
    </form>
  );
}

const PREVIEW_QR_VALUE = "VOONE-EJEMPLO";

function PreviewQr() {
  return (
    <QrCode
      value={PREVIEW_QR_VALUE}
      size={92}
      className="rounded-xl shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)]"
      title="Vista previa del QR"
    />
  );
}

function PassPreviewCard({ values, presetName }: { values: TemplateFormValues; presetName?: string }) {
  const foreground = textColorFor(values.hexBackgroundColor);

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/45 p-4 shadow-[0_28px_70px_-42px_rgba(67,48,43,0.82)]" style={{ background: values.hexBackgroundColor, color: foreground }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase opacity-70">Google Wallet</p>
          <p className="mt-1 text-xs font-semibold opacity-75">{presetName ?? "Preset Voone"}</p>
        </div>
        <PreviewQr />
      </div>
      <h3 className="mt-5 font-serif text-2xl font-semibold tracking-tight">{values.programName || "Nombre del programa"}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/14 p-3">
          <p className="text-[10px] uppercase opacity-70">Puntos</p>
          <p className="mt-1 font-serif text-2xl font-semibold">1.250</p>
          <p className="text-xs opacity-70">{values.pointsLabel || "Etiqueta de puntos"}</p>
        </div>
        <div className="rounded-2xl bg-white/14 p-3">
          <p className="text-[10px] uppercase opacity-70">Nivel</p>
          <p className="mt-1 font-serif text-2xl font-semibold">Gold</p>
          <p className="text-xs opacity-70">{values.tierLabel || "Etiqueta de nivel"}</p>
        </div>
      </div>
      <div className="mt-3 max-h-16 overflow-hidden rounded-2xl bg-white/14 p-3 text-xs leading-5 opacity-85">{values.benefitsText || "Los beneficios aparecerán aquí."}</div>
    </div>
  );
}
