"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Copy } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  getTemplatePresets,
  provisionClinic,
  type ProvisionedClinic
} from "@/lib/api-client";

/**
 * Onboards a clinic.
 *
 * These are the columns that actually exist. The previous version collected a city and a
 * plan — neither of which is a field on Clinic — and none of slug, addressLine or pincode,
 * while being backed by a mock that fabricated an id. So it appeared to work and wrote
 * nothing.
 *
 * The colour is not asked for: it comes from the chosen preset, which is what a preset is
 * for. The labels and benefit copy are not asked for either — the backend defaults them to
 * Spanish text the clinic refines later — so this asks only for what an operator has to
 * hand on an onboarding call.
 */
const clinicSchema = z.object({
  // Written down rather than derived from the name, because it becomes a URL printed on a
  // physical poster: renaming the clinic must never invalidate it.
  slug: z
    .string()
    .trim()
    .min(2, "Añade un identificador")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones (por ejemplo: clinica-nova)"),
  name: z.string().trim().min(2, "Añade el nombre de la clínica").max(48, "El nombre es demasiado largo"),
  addressLine: z.string().trim().min(2, "Añade la dirección"),
  pincode: z.string().trim().min(3, "Añade el código postal"),
  presetId: z.string().min(1, "Elige un preset"),
  programName: z.string().trim().min(2, "Añade el nombre del programa")
});

type ClinicFormValues = z.infer<typeof clinicSchema>;

export function ClinicForm({ appOrigin }: { appOrigin: string }) {
  const [provisioned, setProvisioned] = React.useState<ProvisionedClinic | null>(null);
  const presets = useQuery({ queryKey: ["template-presets"], queryFn: getTemplatePresets });

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      slug: "",
      name: "",
      addressLine: "",
      pincode: "",
      presetId: "",
      programName: ""
    }
  });

  const mutation = useMutation({
    mutationFn: provisionClinic,
    onSuccess: setProvisioned
  });

  if (provisioned) {
    return <ProvisionedSummary provisioned={provisioned} appOrigin={appOrigin} />;
  }

  // The backend's messages are the Spanish copy to show — a taken slug in particular is
  // something the operator must act on, and "algo ha fallado" would not tell them what.
  const failure = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.detail
      ? mutation.error.detail
      : "No se ha podido dar de alta la clínica. Inténtalo de nuevo."
    : null;

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="max-w-3xl"
      noValidate
    >
      <Card className="rounded-[26px] border-[#ded2cb] bg-white/78 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="font-serif text-3xl tracking-tight">Clinic record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nombre de la clínica" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Clínica Nova" className="rounded-2xl bg-[#fffaf6]" />
          </Field>

          <Field
            label="Identificador (URL)"
            error={form.formState.errors.slug?.message}
            hint="Aparecerá en el código QR y no debería cambiar nunca."
          >
            <Input {...form.register("slug")} placeholder="clinica-nova" autoCapitalize="none" className="rounded-2xl bg-[#fffaf6]" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Dirección" error={form.formState.errors.addressLine?.message}>
              <Input {...form.register("addressLine")} placeholder="Carrer de Balmes 12" className="rounded-2xl bg-[#fffaf6]" />
            </Field>
            <Field label="Código postal" error={form.formState.errors.pincode?.message}>
              <Input {...form.register("pincode")} placeholder="08007" inputMode="numeric" className="rounded-2xl bg-[#fffaf6]" />
            </Field>
          </div>

          <Field label="Nombre del programa" error={form.formState.errors.programName?.message}>
            <Input {...form.register("programName")} placeholder="Nova Beauty Club" className="rounded-2xl bg-[#fffaf6]" />
          </Field>

          <Field
            label="Preset del pase"
            error={form.formState.errors.presetId?.message}
            hint="Define el color del pase y de la página de alta."
          >
            {presets.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                className="h-10 w-full rounded-2xl border border-input bg-[#fffaf6] px-3 text-sm shadow-sm"
                {...form.register("presetId")}
              >
                <option value="">Elige un preset</option>
                {presets.data?.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {failure ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {failure}
            </p>
          ) : null}

          <Button type="submit" className="w-full rounded-2xl sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? "Dando de alta..." : "Dar de alta clínica"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

/**
 * What the operator actually needs afterwards: the code to print. Showing the QR here means
 * onboarding ends with the physical artifact in hand rather than a row id and a next step
 * nobody wrote down.
 */
function ProvisionedSummary({
  provisioned,
  appOrigin
}: {
  provisioned: ProvisionedClinic;
  appOrigin: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const signupUrl = `${appOrigin}/alta/${provisioned.clinic.slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mx-auto max-w-xl rounded-lg">
      <CardHeader>
        <CardTitle>{provisioned.clinic.name} ya está de alta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-sm text-muted-foreground">{provisioned.template.programName}</p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span
              className="inline-block h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: provisioned.template.hexBackgroundColor }}
              aria-hidden
            />
            {provisioned.template.hexBackgroundColor}
          </p>
        </div>

        <QrCode value={signupUrl} size={200} className="mx-auto" title="Código QR de alta" />
        <p className="break-all text-center text-xs text-muted-foreground">{signupUrl}</p>

        <Button type="button" variant="outline" className="w-full" onClick={copy}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Enlace copiado
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copiar enlace
            </>
          )}
        </Button>

        {/* status is PENDING until a wallet class exists for the template. Said plainly
            rather than hidden: sign-ups work now, the pass does not yet. */}
        <p className="text-center text-xs text-muted-foreground">
          La página de alta ya funciona. El pase Wallet queda pendiente de aprovisionar
          ({provisioned.template.status}).
        </p>
      </CardContent>
    </Card>
  );
}
