"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getPasswordSetupDetails,
  setPasswordWithToken,
  type PasswordSetupDetails,
} from "@/features/auth/api/password-setup";
import { ApiError } from "@/lib/api-client";

/** The rules the backend enforces on a new password, shown upfront and checked as the person types. */
const PASSWORD_RULES = [
  {
    label: "Al menos 8 caracteres",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "Una letra mayúscula",
    test: (value: string) => /[A-Z]/.test(value),
  },
  { label: "Un número", test: (value: string) => /[0-9]/.test(value) },
] as const;

const passwordSetupSchema = z
  .object({
    password: z
      .string()
      .min(8, "Usa al menos 8 caracteres")
      .max(128, "La contraseña es demasiado larga")
      .regex(/[A-Z]/, "Incluye una letra mayúscula")
      .regex(/[0-9]/, "Incluye un número"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type PasswordSetupValues = z.infer<typeof passwordSetupSchema>;

const formatExpiry = (value: string): string =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));

export function PasswordSetupForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [complete, setComplete] = React.useState(false);
  const [details, setDetails] = React.useState<PasswordSetupDetails | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = React.useState(true);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    React.useState(false);
  const expiresAtLabel = details ? formatExpiry(details.expiresAt) : "";
  const form = useForm<PasswordSetupValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });
  const passwordValue = form.watch("password");

  React.useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetailsLoading(true);
      setStatus(null);

      try {
        const nextDetails = await getPasswordSetupDetails(token);

        if (!cancelled) {
          setDetails(nextDetails);
        }
      } catch (error) {
        if (!cancelled) {
          const detail =
            error instanceof ApiError && error.detail
              ? error.detail
              : "Este enlace no es válido o ha caducado. Pide uno nuevo al equipo de Voone.";
          setStatus(detail);
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [token]);

  React.useEffect(() => {
    if (!complete) return;

    const timeout = window.setTimeout(() => {
      router.push("/login");
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [complete, router]);

  async function submit(values: PasswordSetupValues) {
    setStatus(null);

    try {
      await setPasswordWithToken(token, values);
      setComplete(true);
      form.reset();
    } catch (error) {
      const detail =
        error instanceof ApiError && error.detail
          ? error.detail
          : "No se pudo usar este enlace. Pide uno nuevo al equipo de Voone.";
      setStatus(detail);
    }
  }

  if (complete) {
    return (
      <div className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-[#4d8f61]" />
        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">
          Contraseña actualizada
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">
          Tu cuenta está lista. Te llevamos al inicio de sesión para que
          entres{details ? ` con ${details.email}` : ""}.
        </p>
        <Button asChild className="mt-6 w-full rounded-2xl">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  if (detailsLoading) {
    return (
      <div className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2d6] text-[#704f40]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">
          Comprobando el enlace
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">
          Un momento, estamos preparando la creación de tu contraseña.
        </p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2d6] text-[#704f40]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">
          Enlace no disponible
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">
          {status ??
            "Este enlace no es válido o ha caducado. Pide uno nuevo al equipo de Voone."}
        </p>
        <Button asChild className="mt-6 w-full rounded-2xl">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8"
      noValidate
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2d6] text-[#704f40]">
        <LockKeyhole className="h-5 w-5" />
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47845]">
        {details.clinicName}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">
        Crea tu contraseña
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#806d63]">
        Usa este enlace de un solo uso para crear la contraseña de {details.email}.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input
              {...form.register("password")}
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#806d63] transition hover:bg-[#f1e2d6] hover:text-[#2e2421]"
            >
              {passwordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>
        <ul aria-label="Requisitos de la contraseña" className="grid gap-1 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(passwordValue);

            return (
              <li
                key={rule.label}
                className={
                  met
                    ? "flex items-center gap-2 text-[#2f7d57]"
                    : "flex items-center gap-2 text-[#806d63]"
                }
              >
                <CheckCircle2
                  className={met ? "h-3.5 w-3.5" : "h-3.5 w-3.5 opacity-30"}
                  aria-hidden
                />
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>
        <Field
          label="Confirmar contraseña"
          error={form.formState.errors.confirmPassword?.message}
        >
          <div className="relative">
            <Input
              {...form.register("confirmPassword")}
              type={confirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible((visible) => !visible)}
              aria-label={
                confirmPasswordVisible
                  ? "Ocultar contraseña confirmada"
                  : "Mostrar contraseña confirmada"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#806d63] transition hover:bg-[#f1e2d6] hover:text-[#2e2421]"
            >
              {confirmPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>
      </div>

      {status ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {status}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="mt-6 w-full rounded-2xl"
      >
        {form.formState.isSubmitting ? "Guardando..." : "Crear contraseña"}
      </Button>
      <p className="mt-4 text-xs leading-5 text-[#806d63]">
        Este enlace caduca el {expiresAtLabel} y deja de funcionar en cuanto
        crees la contraseña.
      </p>
    </form>
  );
}
