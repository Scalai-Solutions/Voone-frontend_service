"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, ChevronDown, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignUpMember } from "@/features/members/api/useSignUpMember";
import {
  ApiError,
  type MemberPassWallet,
  type PublicClinic,
} from "@/lib/api-client";
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
const today = new Date();
const CURRENT_YEAR = today.getFullYear();
const TODAY_ISO = today.toISOString().slice(0, 10);

const panelClassName =
  "relative mt-16 flex-1 rounded-[36px] border border-[#eee5da] bg-[#fffbf7]/86 px-7 pb-7 pt-18 shadow-[0_28px_70px_rgba(55,42,32,0.12)] backdrop-blur-xl";
const fieldInputClassName =
  "h-11 rounded-2xl border-[#eadfd2] bg-[#fdf8f2] text-center text-[0.88rem] shadow-none placeholder:text-[#b4aa9e] focus-visible:ring-[#c5a26e]";
const smallLabelClassName =
  "mb-1.5 text-center text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#a09688]";

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
    .refine(
      (value) => normalizeSpanishMobile(value) !== null,
      "Introduce un móvil español válido",
    ),
  // Both optional. A required demographic on a form someone fills standing at a
  // reception desk is a reason to abandon it, and a lost member costs more than a
  // missing data point.
  //
  // Empty string rather than undefined as the resting value, because that is what an
  // untouched <input> and <select> actually hold — mapping it to undefined happens once,
  // on submit, rather than being guarded at every read.
  birthDate: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const date = new Date(`${value}T00:00:00.000Z`);
      const year = date.getUTCFullYear();

      return (
        date.toISOString().slice(0, 10) === value &&
        year >= CURRENT_YEAR - 120 &&
        value <= TODAY_ISO
      );
    }, "Introduce una fecha de nacimiento válida"),
  sex: z.union([
    z.enum(SEX_OPTIONS.map((option) => option.value)),
    z.literal(""),
  ]),
  // Never .default(true) and never pre-ticked: consent has to be an affirmative act, and an
  // unticked box is a valid "no" that still creates the member.
  consentMarketing: z.boolean(),
  // Required and never pre-ticked: the person accepts the processing of their data themselves.
  acceptedPrivacy: z.boolean().refine((value) => value, {
    message: "Debes aceptar el tratamiento de tus datos para unirte",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function WalletReady({
  clinic,
  wallet,
}: {
  clinic: PublicClinic;
  wallet: MemberPassWallet;
}) {
  const walletPageUrl = wallet.code
    ? `/wallet/add/${encodeURIComponent(wallet.code)}`
    : null;
  const appleUrl =
    wallet.passes.apple.url ??
    (wallet.code
      ? `/api/wallet/passes/${encodeURIComponent(wallet.code)}/apple`
      : null);
  const currentYear = new Date().getFullYear();

  return (
    <div className={panelClassName}>
      <p className="absolute right-7 top-10 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#9f958a]">
        {currentYear} - {currentYear + 1}
      </p>

      <div className="text-center">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#9b927f]">
          {clinic.name}
        </p>
        <h2 className="mt-7 font-serif text-[1.92rem] font-semibold leading-none tracking-[-0.045em] text-[#24211f]">
          Tu pase está listo
        </h2>
        <p className="mx-auto mt-4 max-w-[286px] text-[0.82rem] leading-6 text-[#7d746b]">
          Añádelo a tu Wallet para identificarte en recepción y empezar a
          disfrutar de tus privilegios.
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="mb-4 text-[0.76rem] font-semibold text-[#403a35]">
          Guardar pase
        </p>
        <div className="flex flex-col items-center gap-3">
          {wallet.passes.google.available && wallet.passes.google.url ? (
            <Link
              href={wallet.passes.google.url}
              className="inline-flex min-h-[45px] items-center justify-center rounded-[14px] transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#1a73e8]"
              rel="noopener noreferrer"
            >
              <Image
                src="/wallet/add-to-google-wallet-es.svg"
                alt="Añadir a Google Wallet"
                width={199}
                height={55}
                priority
                className="h-[45px] w-auto"
              />
            </Link>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">
              Google Wallet no está disponible para este pase.
            </div>
          )}

          {appleUrl ? (
            <Link
              href={appleUrl}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[12px] transition duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#0a84ff]"
              rel="noopener noreferrer"
            >
              <Image
                src="/wallet/ES_Add_to_Apple_Wallet_RGB_101921.svg"
                alt="Añadir a Apple Wallet"
                width={133}
                height={35}
                className="h-[44px] w-auto"
              />
            </Link>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-[#d8c8bc] px-4 py-3 text-center text-sm text-[#806d63]">
              Apple Wallet no está disponible para este pase.
            </div>
          )}
        </div>
      </div>

      {walletPageUrl ? (
        <Link
          href={walletPageUrl}
          className="mx-auto mt-9 flex max-w-[248px] items-start gap-3 text-[#2d2824] transition hover:text-[#8a6f4f] focus-visible:rounded-2xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c5a26e]"
        >
          <span className="flex-1 text-center">
            <span className="block text-[0.86rem] font-semibold">
              Ver mi pase completo
            </span>
            <span className="mt-1 block text-[0.6rem] leading-4 text-[#9a9086]">
              Consulta tus datos y beneficios
            </span>
          </span>
          <ChevronDown
            className="mt-1 h-4 w-4 shrink-0 text-[#958779]"
            aria-hidden
          />
        </Link>
      ) : null}

      <p className="mt-9 flex items-center justify-center gap-2 text-[0.82rem] font-semibold text-[#3e3934]">
        <ShieldCheck className="h-4 w-4 text-[#9f8b69]" aria-hidden />
        Acceso privado y seguro
      </p>
      <p className="mt-2 text-center text-[0.72rem] text-[#9a9086]">
        Tu información está protegida
      </p>
    </div>
  );
}

export function SignupForm({ clinic }: { clinic: PublicClinic }) {
  const [done, setDone] = React.useState(false);
  const [wallet, setWallet] = React.useState<MemberPassWallet | null>(null);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      phone: "",
      birthDate: "",
      sex: "",
      consentMarketing: false,
      acceptedPrivacy: false,
    },
  });

  const mutation = useSignUpMember(clinic.slug, {
    onSuccess: (result) => {
      setWallet(result.wallet ?? null);
      setDone(true);
    },
  });

  const onSubmit = (values: SignupFormValues) => {
    mutation.mutate({
      name: values.name,
      phone: values.phone,
      birthDate: values.birthDate === "" ? undefined : values.birthDate,
      sex: values.sex === "" ? undefined : values.sex,
      consentMarketing: values.consentMarketing,
      acceptedPrivacy: values.acceptedPrivacy,
    });
  };

  if (done) {
    if (wallet) {
      return <WalletReady clinic={clinic} wallet={wallet} />;
    }

    return (
      <div className={panelClassName}>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#efe5d9]">
            <Check className="h-6 w-6 text-[#8c765a]" aria-hidden />
          </div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#9b927f]">
            {clinic.name}
          </p>
          <h2 className="mt-7 font-serif text-[1.92rem] font-semibold leading-none tracking-[-0.045em] text-[#24211f]">
            Ya eres miembro
          </h2>
          <p className="mx-auto mt-4 max-w-[286px] text-[0.82rem] leading-6 text-[#7d746b]">
            Tu tarjeta sigue siendo la misma. Si no la encuentras en tu móvil,
            pídela en recepción.
          </p>
          <p className="mt-8 flex items-center justify-center gap-2 text-[0.82rem] font-semibold text-[#3e3934]">
            <ShieldCheck className="h-4 w-4 text-[#9f8b69]" aria-hidden />
            Acceso privado y seguro
          </p>
          <p className="mt-2 text-center text-[0.72rem] text-[#9a9086]">
            {clinic.template.infoText}
          </p>
        </div>
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
      onSubmit={form.handleSubmit(onSubmit)}
      className={panelClassName}
      noValidate
    >
      <p className="absolute right-7 top-10 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#9f958a]">
        {CURRENT_YEAR} - {CURRENT_YEAR + 1}
      </p>

      <div className="text-center">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#9b927f]">
          {clinic.name}
        </p>
        <h2 className="mt-7 font-serif text-[1.92rem] font-semibold leading-none tracking-[-0.045em] text-[#24211f]">
          Tu pase está listo
        </h2>
        <p className="mx-auto mt-4 max-w-[286px] text-[0.82rem] leading-6 text-[#7d746b]">
          Completa tus datos para añadirlo a tu Wallet e identificarte en
          recepción.
        </p>
      </div>

      <div className="mt-7 space-y-3">
        <Field
          label="Nombre y apellidos"
          error={form.formState.errors.name?.message}
          labelClassName={smallLabelClassName}
        >
          <Input
            {...form.register("name")}
            autoComplete="name"
            placeholder="Verónica Navarro"
            enterKeyHint="next"
            className={fieldInputClassName}
          />
        </Field>

        <Field
          label="Móvil"
          error={form.formState.errors.phone?.message}
          labelClassName={smallLabelClassName}
        >
          <Input
            {...form.register("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="612 34 56 78"
            enterKeyHint="done"
            className={fieldInputClassName}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Nacimiento"
            error={form.formState.errors.birthDate?.message}
            labelClassName={smallLabelClassName}
          >
            <Input
              {...form.register("birthDate")}
              type="date"
              autoComplete="bday"
              max={TODAY_ISO}
              enterKeyHint="next"
              className={`${fieldInputClassName} px-2 text-[0.72rem]`}
            />
          </Field>

          <Field
            label="Sexo"
            error={form.formState.errors.sex?.message}
            labelClassName={smallLabelClassName}
          >
            <select
              {...form.register("sex")}
              className="h-11 w-full rounded-2xl border border-[#eadfd2] bg-[#fdf8f2] px-2 text-center text-[0.78rem] text-[#514941] outline-none focus-visible:ring-2 focus-visible:ring-[#c5a26e]"
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

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eee4d9] bg-[#f7efe6] p-3 text-left">
          <input
            type="checkbox"
            {...form.register("acceptedPrivacy")}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c9b9a8] accent-[#8c765a]"
          />
          <span className="text-[0.68rem] leading-4 text-[#7d746b]">
            Acepto que {clinic.name} trate mis datos personales para gestionar
            mi membresía, según la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              política de privacidad
            </a>
            .
          </span>
        </label>
        {form.formState.errors.acceptedPrivacy ? (
          <p role="alert" className="text-xs text-[#9f3d2f]">
            {form.formState.errors.acceptedPrivacy.message}
          </p>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eee4d9] bg-[#f7efe6] p-3 text-left">
          <input
            type="checkbox"
            {...form.register("consentMarketing")}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c9b9a8] accent-[#8c765a]"
          />
          <span className="text-[0.68rem] leading-4 text-[#7d746b]">
            Quiero recibir novedades y ofertas de {clinic.name} por SMS o
            WhatsApp.
          </span>
        </label>
      </div>

      {failure ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl bg-[#f4ded8] p-3 text-center text-sm text-[#9f3d2f]"
        >
          {failure}
        </p>
      ) : null}

      <Button
        type="submit"
        className="mt-5 h-11 w-full rounded-full bg-[#23211f] text-[#fbf7ef] hover:bg-[#3a342e]"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Preparando pase..." : "Crear pase Wallet"}
      </Button>

      <p className="mt-5 flex items-center justify-center gap-2 text-[0.78rem] font-semibold text-[#3e3934]">
        <ShieldCheck className="h-4 w-4 text-[#9f8b69]" aria-hidden />
        Acceso privado y seguro
      </p>
      <p className="mt-2 text-center text-[0.66rem] leading-4 text-[#9a9086]">
        Política de privacidad {clinic.privacyPolicyVersion}.
      </p>
    </form>
  );
}
