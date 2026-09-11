"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createMember, getTemplates, type Member } from "@/lib/api-client";

const memberSchema = z.object({
  name: z.string().min(2, "Add the member name"),
  identity: z.string().min(5, "Add a phone number or email"),
  templateId: z.string().min(1, "Choose a template"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export function MemberForm() {
  const [createdMember, setCreatedMember] = React.useState<(Member & { walletLink: string }) | null>(null);
  const templates = useQuery({ queryKey: ["templates"], queryFn: getTemplates });
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", identity: "", templateId: "" },
  });
  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: (member) => setCreatedMember(member),
  });

  if (createdMember) {
    const shareText = encodeURIComponent(`Your Voone wallet pass is ready: ${createdMember.walletLink}`);
    return (
      <Card className="mx-auto max-w-xl rounded-lg">
        <CardHeader>
          <CardTitle>Member created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">{createdMember.name}</p>
            <p className="text-2xl font-semibold tracking-tight">{createdMember.id}</p>
          </div>
          <QrBlock value={createdMember.walletLink} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Button asChild variant="outline">
              <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`sms:?&body=${shareText}`}>
                <Send className="mr-2 h-4 w-4" /> SMS
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:?subject=Your Voone pass&body=${shareText}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))} className="mx-auto max-w-2xl space-y-4">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Add member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Veronica Navarro" />
          </Field>
          <Field label="Phone or email" error={form.formState.errors.identity?.message}>
            <Input {...form.register("identity")} placeholder="+34 612 440 901 or name@example.com" />
          </Field>
          <Field label="Template" error={form.formState.errors.templateId?.message}>
            {templates.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm" {...form.register("templateId")}>
                <option value="">Choose a template</option>
                {templates.data?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {mutation.error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">Could not create this member. Try again.</p> : null}
          <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create member"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function QrBlock({ value }: { value: string }) {
  const cells = Array.from({ length: 121 }, (_, index) => (value.charCodeAt(index % value.length) + index * 13) % 4 === 0);

  return (
    <div className="mx-auto w-fit rounded-lg bg-white p-4 shadow-inner">
      <div className="grid h-44 w-44 grid-cols-11 grid-rows-11 gap-1">
        {cells.map((filled, index) => (
          <span key={index} className={filled ? "rounded-[2px] bg-neutral-950" : "rounded-[2px] bg-white"} />
        ))}
      </div>
      <p className="mt-3 max-w-44 truncate text-center text-xs text-muted-foreground">{value}</p>
    </div>
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