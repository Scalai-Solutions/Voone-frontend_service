"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The clinic's sign-up QR, at print size.
 *
 * This code is the physical start of the whole programme — it gets printed and put on the
 * reception desk — so it lives in settings, where a clinic already goes for its own
 * configuration, rather than behind a fourth navigation item.
 *
 * The URL is resolved on the server and passed in, so the code renders without JavaScript
 * and there is no origin-detection hydration mismatch. Only the copy button needs a client.
 */
export function SignupQrPanel({ signupUrl }: { signupUrl: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Código QR de alta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Imprímelo y colócalo en recepción. Al escanearlo, la clienta ve tu pase y se da de
          alta en segundos.
        </p>
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
      </CardContent>
    </Card>
  );
}
