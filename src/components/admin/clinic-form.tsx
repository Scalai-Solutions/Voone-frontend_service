"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClinic, type Clinic } from "@/lib/api-client";

const clinicSchema = z.object({
  name: z.string().min(2, "Add the clinic name"),
  city: z.string().min(2, "Add the city"),
  plan: z.string().min(2, "Choose a plan"),
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
          <CardTitle>{clinic.name} is ready for setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Create the clinic&apos;s first wallet template next, scoped to this tenant.</p>
          <Button asChild>
            <Link href={`/dashboard/templates/new?clinicId=${clinic.id}`}>Create first template</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="mx-auto max-w-2xl">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Onboard clinic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Clinic name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Luma Skin Studio" />
          </Field>
          <Field label="City" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} placeholder="Valencia" />
          </Field>
          <Field label="Plan" error={form.formState.errors.plan?.message}>
            <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm" {...form.register("plan")}>
              <option>Launch</option>
              <option>Growth</option>
              <option>Enterprise</option>
            </select>
          </Field>
          {mutation.error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">Clinic could not be created.</p> : null}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create clinic"}</Button>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}