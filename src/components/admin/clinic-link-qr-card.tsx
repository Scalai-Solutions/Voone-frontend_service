"use client";

import * as React from "react";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { downloadQrPdf, QR_TARGETS, type QrTarget } from "@/lib/qr-pdf";

/**
 * One of a clinic's public links, with its QR always on screen: the admin's analytics page
 * shows the sign-up and club codes side by side, instead of behind a "Ver QR" dialog.
 *
 * The URL is resolved on the server and passed in, as in SignupQrPanel, so the code renders
 * without origin detection; only copy and download need the client.
 */
export function ClinicLinkQrCard({
  target,
  title,
  url,
  notice,
}: {
  target: QrTarget;
  /** The card's heading; the eyebrow, hint and PDF wording come from QR_TARGETS. */
  title: string;
  url: string;
  /** Why the link may not work yet (inactive clinic, no live programme). */
  notice?: string | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);
  const text = QR_TARGETS[target];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is still selectable on screen.
    }
  };

  return (
    <section className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">{text.eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#806d63]">{text.hint}</p>
      {notice ? <p className="mt-3 rounded-2xl border border-[#ecd3b4] bg-[#fdf3e7] px-4 py-3 text-xs font-semibold text-[#8a5a2b]">{notice}</p> : null}

      <div ref={qrRef} className="mt-5 flex justify-center">
        <QrCode value={url} size={200} title={text.title} />
      </div>
      <p className="mt-4 break-all rounded-2xl bg-[#fffaf6] px-4 py-3 text-center text-xs text-[#806d63]">{url}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => void copy()}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copiado" : "Copiar enlace"}
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Abrir
          </a>
        </Button>
        <Button type="button" className="rounded-xl bg-[#2d211e] text-white hover:bg-[#44322d]" onClick={() => void downloadQrPdf(qrRef.current, target, url)}>
          <Download className="mr-2 h-4 w-4" /> PDF
        </Button>
      </div>
    </section>
  );
}
