"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClinic, type Clinic } from "@/lib/api-client";

const clinicSchema = z.object({
  name: z.string().min(2, "Añade el nombre de la clínica"),
  city: z.string().min(2, "Añade la ciudad"),
  plan: z.string().min(2, "Elige un plan"),
});

type ClinicFormValues = z.infer<typeof clinicSchema>;

export function ClinicForm() {
  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const form = useForm<ClinicFormValues>({ resolver: zodResolver(clinicSchema), defaultValues: { name: "", city: "", plan: "Launch" } });
  const mutation = useMutation({ mutationFn: createClinic, onSuccess: setClinic });

  if (clinic) {
    return (
      <Card className="mx-auto max-w-xl rounded-lg">
        <CardHeader>
          <CardTitle>{clinic.name} está lista para configurarse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Elige ahora la plantilla Wallet de esta clínica.</p>
          <Button asChild>
            <Link href="/dashboard/templates">Elegir plantilla</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="mx-auto max-w-2xl">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Dar de alta clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nombre de la clínica" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Luma Skin Studio" />
          </Field>
          <Field label="Ciudad" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} placeholder="Valencia" />
          </Field>
          <Field label="Plan" error={form.formState.errors.plan?.message}>
            <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm" {...form.register("plan")}>
              <option value="Launch">Lanzamiento</option>
              <option value="Growth">Crecimiento</option>
              <option value="Enterprise">Empresa</option>
            </select>
          </Field>
          {mutation.error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">No se pudo crear la clínica.</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creando..." : "Crear clínica"}</Button>
        </CardContent>
      </Card>
    </form>
  );
}
