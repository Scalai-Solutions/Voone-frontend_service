"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, signUpMember, type PublicClinic } from "@/lib/api-client";
import { normalizeSpanishMobile } from "@/lib/phone-es";

/**
 * The options the form offers, matching the backend enum exactly.
 *
 * "Prefiero no decirlo" is offered rather than relying on the field being skippable: a
 * member who chose not to say is a different fact from one who never looked at the
 * question, and segmentation that conflated them would quietly under-count.
 */
const SEX_OPTIONS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decirlo", label: "Prefiero no decirlo" },
] as const;

/** Read once, like the backend's bound. */
const CURRENT_YEAR = new Date().getFullYear();

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Introduce tu nombre y apellidos")
    // Matches the backend, which caps at the pass field's width. A longer name would be
    // accepted here and then rejected on submit.
    .max(64, "El nombre es demasiado largo"),
  phone: z
    .string()
    .trim()
    .min(1, "Introduce tu número de móvil")
    .refine((value) => normalizeSpanishMobile(value) !== null, "Introduce un móvil español válido"),
  // Both optional. A required demographic on a form someone fills standing at a
  // reception desk is a reason to abandon it, and a lost member costs more than a
  // missing data point.
  //
  // Empty string rather than undefined as the resting value, because that is what an
  // untouched <input> and <select> actually hold — mapping it to undefined happens once,
  // on submit, rather than being guarded at every read.
  birthYear: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d{4}$/.test(value) &&
          Number(value) >= CURRENT_YEAR - 120 &&
          Number(value) <= CURRENT_YEAR),
      "Introduce un año de nacimiento válido"
    ),
  sex: z.union([z.enum(SEX_OPTIONS.map((option) => option.value)), z.literal("")]),
  // Never .default(true) and never pre-ticked: consent has to be an affirmative act, and an
  // unticked box is a valid "no" that still creates the member.
  consentMarketing: z.boolean(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({ clinic }: { clinic: PublicClinic }) {
  const [done, setDone] = React.useState(false);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", phone: "", birthYear: "", sex: "", consentMarketing: false },
  });

  const mutation = useMutation({
    mutationFn: (values: SignupFormValues) =>
      signUpMember(clinic.slug, {
        name: values.name,
        // Sent exactly as typed, NOT normalized. Member.phoneRaw exists to preserve the
        // original input so a future change to the normalization rules is a backfill
        // rather than data loss — normalizing here would store the canonical form twice
        // and throw away the only copy of what the member actually wrote. The normalizer
        // above is for inline validation only; the backend is what canonicalizes.
        phone: values.phone,
        // Omitted rather than sent empty: the backend treats an absent field as "not
        // asked", and sending "" would fail its enum instead.
        birthYear: values.birthYear === "" ? undefined : Number(values.birthYear),
        sex: values.sex === "" ? undefined : values.sex,
        consentMarketing: values.consentMarketing,
      }),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
          <Check className="h-6 w-6 text-success" aria-hidden />
        </div>
        <h2 className="font-serif text-2xl">Ya eres socia</h2>
        {/* Deliberately does not promise a pass yet: issuance is a separate step, and a
            success screen that shows a wallet button which does not work is worse than
            one that says what actually happens next. */}
        <p className="mt-2 text-sm text-muted-foreground">
          Te hemos dado de alta en {clinic.template.programName}. Te avisaremos en cuanto tu pase
          esté listo para añadirlo a tu móvil.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">{clinic.template.infoText}</p>
      </div>
    );
  }

  // ApiError.detail carries the backend's own Spanish validation copy. Anything else — the
  // API being unreachable, a 500 — has no message safe or useful to show, so it gets a
  // generic line. Critically, this path is reached at all: the sign-up call is not wrapped
  // in the mock fallback, so a failure surfaces instead of looking like success.
  const failure = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.detail
      ? mutation.error.detail
      : "No hemos podido completar tu alta. Inténtalo de nuevo en un momento."
    : null;

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <Field label="Nombre y apellidos" error={form.formState.errors.name?.message}>
        <Input
          {...form.register("name")}
          autoComplete="name"
          placeholder="Verónica Navarro"
          enterKeyHint="next"
        />
      </Field>

      <Field
        label="Móvil"
        error={form.formState.errors.phone?.message}
        hint="Sólo móviles españoles: 6xx o 7xx."
      >
        <Input
          {...form.register("phone")}
          // type="tel" plus inputMode gives a phone keypad on the device this is scanned from.
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="612 34 56 78"
          enterKeyHint="done"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Año de nacimiento"
          error={form.formState.errors.birthYear?.message}
          hint="Opcional"
        >
          <Input
            {...form.register("birthYear")}
            // A year, not a date picker: four digits is faster to type one-handed than
            // scrolling a calendar back forty years, which is what this is scanned on.
            type="text"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            placeholder="1994"
            enterKeyHint="next"
          />
        </Field>

        <Field label="Sexo" error={form.formState.errors.sex?.message} hint="Opcional">
          <select
            {...form.register("sex")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecciona</option>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md bg-muted/50 p-3 text-left">
        <input
          type="checkbox"
          {...form.register("consentMarketing")}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-[var(--primary)]"
        />
        <span className="text-xs text-muted-foreground">
          Quiero recibir novedades y ofertas de {clinic.name} por SMS o WhatsApp. Puedes darte de
          baja cuando quieras.
        </span>
      </label>

      {failure ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {failure}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Un momento..." : "Unirme al club"}
      </Button>

      {/* No link: this references a notice version so the consent record means something,
          but no privacy policy document exists yet. Adding a link to a page that does not
          exist would be worse than stating the version. */}
      <p className="text-center text-[11px] text-muted-foreground">
        Al unirte aceptas que {clinic.name} trate tus datos para gestionar tu membresía.
        Política de privacidad {clinic.privacyPolicyVersion}.
      </p>
    </form>
  );
}
