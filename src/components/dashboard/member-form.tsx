"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Copy, Mail, QrCode, WalletCards } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAddMember } from "@/features/members/api/useAddMember";
import { useSendMemberPassEmail } from "@/features/members/api/useSendMemberPassEmail";
import { ApiError, type StaffMemberPassResult } from "@/lib/api-client";
import { normalizeSpanishMobile } from "@/lib/phone-es";

const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Añade el nombre del miembro")
    // Matches the backend, which caps at the pass field's width.
    .max(64, "El nombre es demasiado largo"),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || normalizeSpanishMobile(value) !== null, "Introduce un móvil español válido")
    .optional(),
  email: z.string().trim().email("Introduce un email válido"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export function MemberForm() {
  const [added, setAdded] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [emailNotice, setEmailNotice] = React.useState<string | null>(null);
  const [issuedPass, setIssuedPass] = React.useState<StaffMemberPassResult | null>(null);
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const mutation = useAddMember({
    onSuccess: (result) => {
      setAdded(result.member.name);
      setIssuedPass(result);
      setCopied(false);
      setEmailNotice(null);
      form.reset();
    },
  });

  const emailMutation = useSendMemberPassEmail({
    onError: (error) => {
      const detail = error instanceof ApiError && error.detail ? error.detail : null;
      setEmailNotice(detail ?? "El envío por email todavía no está configurado. Usa el QR o copia el enlace para compartir el pase.");
    },
    onSuccess: (result) => {
      setEmailNotice(`Email enviado a ${result.email}.`);
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

  const passLink = issuedPass?.wallet.addToWalletUrl ?? null;
  async function copyPassLink() {
    if (!passLink) return;

    await navigator.clipboard.writeText(passLink);
    setCopied(true);
  }

  function sendPassEmail() {
    if (!issuedPass) return;

    setEmailNotice(null);
    emailMutation.mutate(issuedPass.member.id);
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate({
        name: values.name,
        email: values.email,
        phone: values.phone ? values.phone : undefined,
      }))}
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
              Pase creado para {added}.
            </p>
          ) : null}

          <Field label="Nombre y apellidos" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} autoComplete="off" placeholder="Verónica Navarro" />
          </Field>

          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              {...form.register("email")}
              type="email"
              autoComplete="off"
              placeholder="nombre@example.com"
            />
          </Field>

          <Field
            label="Móvil (opcional)"
            error={form.formState.errors.phone?.message}
            hint="Opcional. Si se añade, sólo móviles españoles: 6xx o 7xx."
          >
            <Input
              {...form.register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="612 34 56 78"
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
            {mutation.isPending ? "Creando pase..." : "Crear pase"}
          </Button>
        </CardContent>
      </Card>

      {issuedPass ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5" /> Compartir pase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {passLink ? (
              <>
                <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="mx-auto rounded-2xl border border-border bg-white p-3 sm:mx-0">
                    <QRCodeSVG value={passLink} size={156} level="M" includeMargin />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escanea este QR desde el móvil del cliente, copia la URL segura o envíale el pase por email cuando SendGrid esté configurado.
                    </p>
                    <div className="break-all rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                      {passLink}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button type="button" onClick={copyPassLink} variant="outline" className="w-full sm:w-auto">
                        <Copy className="mr-2 h-4 w-4" /> {copied ? "URL copiada" : "Copiar URL"}
                      </Button>
                      <Button type="button" onClick={sendPassEmail} className="w-full sm:w-auto" disabled={emailMutation.isPending}>
                        <Mail className="mr-2 h-4 w-4" /> {emailMutation.isPending ? "Enviando..." : "Enviar email"}
                      </Button>
                    </div>
                    {emailNotice ? <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">{emailNotice}</p> : null}
                  </div>
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-md bg-muted/50 p-3"><QrCode className="mr-2 inline h-4 w-4" />Google Wallet: {issuedPass.wallet.passes.google.available ? "listo" : "no disponible"}</div>
                  <div className="rounded-md bg-muted/50 p-3"><QrCode className="mr-2 inline h-4 w-4" />Apple Wallet: {issuedPass.wallet.passes.apple.available ? "listo" : "no disponible"}</div>
                </div>
              </>
            ) : <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">No se ha podido generar el enlace seguro del pase. Revisa CARD_REDEMPTION_SECRET en el backend.</p>}
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
