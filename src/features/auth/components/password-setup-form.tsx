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
import { getPasswordSetupDetails, setPasswordWithToken, type PasswordSetupDetails } from "@/features/auth/api/password-setup";
import { ApiError } from "@/lib/api-client";

const passwordSetupSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PasswordSetupValues = z.infer<typeof passwordSetupSchema>;

const formatExpiry = (value: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));

export function PasswordSetupForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [complete, setComplete] = React.useState(false);
  const [details, setDetails] = React.useState<PasswordSetupDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(true);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false);
  const expiresAtLabel = details ? formatExpiry(details.expiresAt) : "";
  const form = useForm<PasswordSetupValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

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
          const detail = error instanceof ApiError && error.detail ? error.detail : "This setup link is invalid or expired. Ask Voone admin for a new link.";
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
      const detail = error instanceof ApiError && error.detail ? error.detail : "This setup link could not be used. Ask Voone admin for a new link.";
      setStatus(detail);
    }
  }

  if (complete) {
    return (
      <div className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-[#4d8f61]" />
        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">Password updated</h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">Your account is ready. Navigating to login so you can sign in{details ? ` with ${details.email}` : ""}.</p>
        <Button asChild className="mt-6 w-full rounded-2xl">
          <Link href="/login">Go to login</Link>
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
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">Checking setup link</h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">One moment while we prepare your password setup.</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2d6] text-[#704f40]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">Link unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[#806d63]">{status ?? "This setup link is invalid or expired. Ask Voone admin for a new link."}</p>
        <Button asChild className="mt-6 w-full rounded-2xl">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="rounded-[28px] border border-[#d9c9b6] bg-[#fffaf3]/90 p-6 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl sm:p-8" noValidate>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2d6] text-[#704f40]">
        <LockKeyhole className="h-5 w-5" />
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47845]">{details.clinicName}</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#2e2421]">Set your password</h1>
      <p className="mt-3 text-sm leading-6 text-[#806d63]">Use this one-time link to create the password for {details.email}.</p>

      <div className="mt-6 space-y-4">
        <Field label="Password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input {...form.register("password")} type={passwordVisible ? "text" : "password"} autoComplete="new-password" className="pr-12" />
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#806d63] transition hover:bg-[#f1e2d6] hover:text-[#2e2421]"
            >
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
          <div className="relative">
            <Input {...form.register("confirmPassword")} type={confirmPasswordVisible ? "text" : "password"} autoComplete="new-password" className="pr-12" />
            <button
              type="button"
              onClick={() => setConfirmPasswordVisible((visible) => !visible)}
              aria-label={confirmPasswordVisible ? "Hide confirmed password" : "Show confirmed password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#806d63] transition hover:bg-[#f1e2d6] hover:text-[#2e2421]"
            >
              {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </div>

      {status ? <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{status}</p> : null}

      <Button type="submit" disabled={form.formState.isSubmitting} className="mt-6 w-full rounded-2xl">
        {form.formState.isSubmitting ? "Saving..." : "Set password"}
      </Button>
      <p className="mt-4 text-xs leading-5 text-[#806d63]">This link expires {expiresAtLabel} and stops working after the password is set.</p>
    </form>
  );
}
