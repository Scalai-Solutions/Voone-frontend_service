"use client";

/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTemplateStarterValues, scratchTemplateValues, type TemplateStarterId } from "@/components/dashboard/template-starters";
import { saveTemplate, type Template } from "@/lib/api-client";

const templateSchema = z.object({
  name: z.string().min(2, "Añade un nombre de plantilla"),
  clinicBranding: z.string().min(2, "Añade el nombre de la clínica que se verá en el pase"),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color para el pase"),
  pointsLabel: z.string().min(2, "Añade la etiqueta de puntos"),
  tierLabel: z.string().min(2, "Añade la etiqueta de nivel"),
  benefits: z.string().min(8, "Añade un mensaje breve de beneficios"),
  infoText: z.string().min(8, "Añade un mensaje breve de información"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

function luminance(hex: string) {
  const clean = hex.replace("#", "");
  const values = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = values.map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function textColorFor(backgroundColor: string) {
  return luminance(backgroundColor) > 0.45 ? "#2b211c" : "#fff9f2";
}

export function TemplateForm({ initialTemplate, starter }: { initialTemplate?: Template; starter?: TemplateStarterId }) {
  const queryClient = useQueryClient();
  const [heroWarning, setHeroWarning] = React.useState<string | null>(null);
  const [savedTemplate, setSavedTemplate] = React.useState<Template | null>(null);
  const [previewProvider, setPreviewProvider] = React.useState<"apple" | "google">("google");
  const starterValues = getTemplateStarterValues(starter);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      ...scratchTemplateValues,
      ...initialTemplate,
      ...starterValues,
    },
  });

  const values = form.watch();
  const mutation = useMutation({
    mutationFn: (input: TemplateFormValues) => saveTemplate(input, initialTemplate?.id),
    onSuccess: (template) => {
      setSavedTemplate(template);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

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
      const backgroundLuminance = luminance(values.backgroundColor);
      setHeroWarning(
        Math.abs(imageLuminance - backgroundLuminance) < 0.22
          ? "Esta imagen se parece demasiado al color del pase. Elige una imagen con más contraste o ajusta el fondo para que el banner no desaparezca."
          : null
      );
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  }

  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="voone-panel p-5">
          <div className="relative">
            <div>
              <p className="voone-kicker">Editar plantilla</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Detalles del pase</h1>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nombre de la plantilla" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} placeholder="Gold Beauty Club" />
              </Field>
              <Field label="Marca de la clínica" error={form.formState.errors.clinicBranding?.message}>
                <Input {...form.register("clinicBranding")} placeholder="Club Clínica Aurea" />
              </Field>
            </div>
          </div>
        </section>

        <section className="voone-panel p-5">
          <div className="relative">
            <div>
              <p className="voone-kicker">Diseño</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Color e imágenes</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Color de fondo" error={form.formState.errors.backgroundColor?.message}>
                <div className="flex items-center gap-3 rounded-md border border-input bg-card px-3 py-2 shadow-sm">
                  <input
                    type="color"
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                    value={values.backgroundColor}
                    onChange={(event) => form.setValue("backgroundColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                  />
                  <input type="hidden" {...form.register("backgroundColor")} />
                  <span className="text-sm text-muted-foreground">Elige un color para el pase</span>
                </div>
              </Field>
              <Field label="Subir logo">
                <Input type="file" accept="image/*" />
              </Field>
              <Field label="Imagen principal" className="md:col-span-2">
                <Input type="file" accept="image/*" onChange={(event) => checkHeroContrast(event.target.files?.[0])} />
                {heroWarning ? (
                  <p className="mt-2 flex items-start gap-2 rounded-md bg-[#fff7e7] p-3 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {heroWarning}
                  </p>
                ) : null}
              </Field>
            </div>
          </div>
        </section>

        <section className="voone-panel p-5">
          <div className="relative">
            <div>
              <p className="voone-kicker">Recompensas</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Texto para miembros</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Etiqueta de puntos" error={form.formState.errors.pointsLabel?.message}>
                <Input {...form.register("pointsLabel")} placeholder="Saldo Beauty" />
              </Field>
              <Field label="Etiqueta de nivel" error={form.formState.errors.tierLabel?.message}>
                <Input {...form.register("tierLabel")} placeholder="Miembro Gold" />
              </Field>
              <Field label="Beneficios" error={form.formState.errors.benefits?.message} className="md:col-span-2">
                <Textarea {...form.register("benefits")} placeholder="Reservas prioritarias, ofertas para miembros, crédito de cumpleaños." />
              </Field>
              <Field label="Texto informativo" error={form.formState.errors.infoText?.message} className="md:col-span-2">
                <Textarea {...form.register("infoText")} placeholder="Muestra este pase en recepción antes de pagar." />
              </Field>
            </div>
          </div>
        </section>

        <section className="voone-panel p-4">
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm">
              {mutation.error ? <span className="text-destructive">No se pudo guardar. Inténtalo de nuevo o revisa la conexión con la API.</span> : null}
              {savedTemplate ? (
                <span className="inline-flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Plantilla guardada para los proveedores Wallet disponibles.
                </span>
              ) : null}
            </div>
            <Button type="submit" className="rounded-2xl px-6" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar plantilla"}
            </Button>
          </div>
        </section>
      </div>

      <aside className="no-scrollbar space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        <section className="voone-dark-panel p-5">
          <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="voone-kicker">Vista previa</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white">Tarjetas Wallet</h2>
              </div>
              <CreditCard className="h-6 w-6 text-gold-light" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-1">
              <button
                type="button"
                className={previewProvider === "google" ? "rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-bold text-[#241612]" : "rounded-xl px-3 py-2 text-sm font-bold text-white/60"}
                onClick={() => setPreviewProvider("google")}
              >
                Google
              </button>
              <button
                type="button"
                className={previewProvider === "apple" ? "rounded-xl bg-[#fffaf3] px-3 py-2 text-sm font-bold text-[#241612]" : "rounded-xl px-3 py-2 text-sm font-bold text-white/60"}
                onClick={() => setPreviewProvider("apple")}
              >
                Apple
              </button>
            </div>
            <div className="mt-5">
              {previewProvider === "google" ? (
                <PassPreviewCard provider="Google Wallet" values={values} tone="dark" />
              ) : (
                <PassPreviewCard provider="Apple Wallet" values={values} tone="light" />
              )}
            </div>
          </div>
        </section>
      </aside>
    </form>
  );
}

function RandomQr({ seed }: { seed: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const code = seed.charCodeAt(index % Math.max(seed.length, 1)) || 19;
    return (code * (index + 7) + index * 11) % 5 < 2 || [0, 1, 7, 8, 5, 6, 35, 36, 42, 43, 40, 41].includes(index);
  });

  return (
    <div className="grid h-32 w-32 grid-cols-7 gap-1 rounded-xl bg-white p-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)]" aria-label="Vista previa del QR">
      {cells.map((active, index) => (
        <span key={index} className={active ? "rounded-[2px] bg-[#241612]" : "rounded-[2px] bg-[#efe2d5]"} />
      ))}
    </div>
  );
}

function PassPreviewCard({
  provider,
  values,
  tone,
}: {
  provider: "Apple Wallet" | "Google Wallet";
  values: TemplateFormValues;
  tone: "light" | "dark";
}) {
  const foreground = tone === "dark" ? "#fff8ef" : textColorFor(values.backgroundColor);
  const background = tone === "dark" ? `linear-gradient(145deg, ${values.backgroundColor}, #21130f)` : values.backgroundColor;

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/45 p-5 shadow-[0_28px_70px_-42px_rgba(67,48,43,0.82)]" style={{ background, color: foreground }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{provider}</p>
          <p className="mt-1 text-xs font-semibold opacity-75">{values.clinicBranding || "Club de la clínica"}</p>
        </div>
        <RandomQr seed={`${provider}-${values.name}-${values.backgroundColor}`} />
      </div>
      <h3 className="mt-6 font-serif text-2xl font-semibold tracking-tight">{values.name || "Nombre de plantilla"}</h3>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/14 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">Puntos</p>
          <p className="mt-1 font-serif text-2xl font-semibold">1,250</p>
          <p className="text-xs opacity-70">{values.pointsLabel || "Etiqueta de puntos"}</p>
        </div>
        <div className="rounded-2xl bg-white/14 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">Nivel</p>
          <p className="mt-1 font-serif text-2xl font-semibold">Gold</p>
          <p className="text-xs opacity-70">{values.tierLabel || "Etiqueta de nivel"}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/14 p-3 text-xs leading-5 opacity-85">{values.benefits || "Los beneficios aparecerán aquí."}</div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}