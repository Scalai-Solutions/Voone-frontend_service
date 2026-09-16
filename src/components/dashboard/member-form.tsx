"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, addMemberAsStaff } from "@/lib/api-client";
import { normalizeSpanishMobile } from "@/lib/phone-es";

const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Añade el nombre del miembro")
    // Matches the backend, which caps at the pass field's width.
    .max(64, "El nombre es demasiado largo"),
  // Was a single loose `identity` accepting a phone or an email with no format check. A
  // phone is now required and validated: it is the member's identity, it is what the
  // unique index deduplicates on, and an unnormalized value would violate the database's
  // E.164 constraint and surface as a 500.
  phone: z
    .string()
    .trim()
    .min(1, "Añade el móvil del miembro")
    .refine((value) => normalizeSpanishMobile(value) !== null, "Introduce un móvil español válido"),
  email: z
    .union([z.literal(""), z.string().trim().email("Introduce un email válido")])
    .optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export function MemberForm() {
  const [added, setAdded] = React.useState<string | null>(null);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) =>
      addMemberAsStaff({
        name: values.name,
        // As typed — see the note on MembershipSignupInput.phone.
        phone: values.phone,
        email: values.email ? values.email : undefined,
      }),
    onSuccess: (_result, values) => {
      setAdded(values.name);
      form.reset();
    },
  });

  // The backend answers a new member and an existing one identically, on purpose, so there
  // is no member id or wallet link to show here. The old success screen displayed a
  // fabricated id and a QR of a placeholder URL; a confirmation and a way to add the next
  // person is what a reception desk actually needs.
  const failure = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.detail
      ? mutation.error.detail
      : "No se ha podido añadir este miembro. Inténtalo de nuevo."
    : null;

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="mx-auto max-w-2xl space-y-4"
      noValidate
    >
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Añadir miembro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {added ? (
            <p className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {added} ya es miembro del club.
            </p>
          ) : null}

          <Field label="Nombre y apellidos" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} autoComplete="off" placeholder="Verónica Navarro" />
          </Field>

          <Field
            label="Móvil"
            error={form.formState.errors.phone?.message}
            hint="Sólo móviles españoles: 6xx o 7xx."
          >
            <Input
              {...form.register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="612 34 56 78"
            />
          </Field>

          <Field label="Email (opcional)" error={form.formState.errors.email?.message}>
            <Input
              {...form.register("email")}
              type="email"
              autoComplete="off"
              placeholder="nombre@example.com"
            />
          </Field>

          {/* Stated rather than offered as a checkbox: staff cannot consent to marketing on
              a client's behalf, so the member is created without it and opts in themselves
              through the QR form. */}
          <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            El alta se registra sin consentimiento de marketing. Para recibir comunicaciones,
            la clienta debe aceptarlo ella misma desde el formulario del código QR.
          </p>

          {failure ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {failure}
            </p>
          ) : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? "Añadiendo..." : "Añadir miembro"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
