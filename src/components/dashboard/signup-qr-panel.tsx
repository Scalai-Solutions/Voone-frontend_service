"use client";

import * as React from "react";
import { Check, Copy, Download, QrCode as QrCodeIcon, X } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { QR_TARGETS, downloadQrPdf, type QrTarget } from "@/lib/qr-pdf";

/**
 * The clinic's sign-up QR, at print size.
 *
 * This code is the physical start of the whole programme — it gets printed and put on the
 * reception desk — so it lives on the center home page where staff start their day.
 *
 * The URL is resolved on the server and passed in, so the code renders without JavaScript
 * and there is no origin-detection hydration mismatch. Only the copy button needs a client.
 */
export function SignupQrPanel({ signupUrl, clubUrl }: { signupUrl: string; clubUrl?: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [target, setTarget] = React.useState<QrTarget>("signup");
  const qrRef = React.useRef<HTMLDivElement>(null);
  const text = QR_TARGETS[target];
  const url = target === "club" && clubUrl ? clubUrl : signupUrl;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => downloadQrPdf(qrRef.current, target, url);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="rounded-full bg-[#f1d6bd] px-5 py-3 font-semibold text-[#402d26] hover:bg-[#f6e2cf]">
        <QrCodeIcon className="mr-2 h-4 w-4" /> Ver QR
      </Button>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-[128px] z-50 flex items-start justify-center overflow-y-auto bg-[#1d1513]/70 p-5 pt-8 backdrop-blur-sm md:top-[144px]" role="dialog" aria-modal="true" aria-labelledby="signup-qr-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#2e2421] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{text.eyebrow}</p>
                <h2 id="signup-qr-title" className="mt-2 font-serif text-3xl font-semibold">{text.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#806d63]">{text.hint}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#806d63] hover:bg-[#f6eee8]" aria-label="Cerrar QR">
                <X className="h-5 w-5" />
              </button>
            </div>

            {clubUrl ? (
              <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-[#f6eee8] p-1" role="tablist" aria-label="Qué enlace mostrar">
                {(Object.keys(QR_TARGETS) as QrTarget[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={target === key}
                    onClick={() => {
                      setTarget(key);
                      setCopied(false);
                    }}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${target === key ? "bg-white text-[#2e2421] shadow-sm" : "text-[#806d63] hover:text-[#2e2421]"}`}
                  >
                    {QR_TARGETS[key].tab}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={qrRef} className="mt-6 flex justify-center">
              <QrCode value={url} size={240} title={text.title} />
            </div>
            <p className="mt-4 break-all rounded-2xl bg-[#fffaf6] px-4 py-3 text-center text-xs text-[#806d63]">{url}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={copy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copiado" : "Copiar enlace"}
              </Button>
              <Button type="button" className="rounded-xl bg-[#2d211e] text-white hover:bg-[#44322d]" onClick={() => void download()}>
                <Download className="mr-2 h-4 w-4" /> Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
