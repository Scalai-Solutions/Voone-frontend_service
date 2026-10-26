"use client";

import * as React from "react";
import { Check, Copy, Download, QrCode as QrCodeIcon, X } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";

/**
 * The clinic's sign-up QR, at print size.
 *
 * This code is the physical start of the whole programme — it gets printed and put on the
 * reception desk — so it lives on the center home page where staff start their day.
 *
 * The URL is resolved on the server and passed in, so the code renders without JavaScript
 * and there is no origin-detection hydration mismatch. Only the copy button needs a client.
 */
export function SignupQrPanel({ signupUrl }: { signupUrl: string }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrPng = async (svg: SVGSVGElement): Promise<string> => {
    const source = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));

    try {
      const image = new Image();
      image.decoding = "async";
      image.src = svgUrl;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 720;
      const context = canvas.getContext("2d");

      if (!context) throw new Error("El lienzo no está disponible");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };

  const download = async () => {
    const svg = qrRef.current?.querySelector("svg");

    if (!svg) return;

    const [{ jsPDF }, qrImage] = await Promise.all([import("jspdf"), qrPng(svg)]);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });

    pdf.setFillColor("#fffaf6");
    pdf.rect(0, 0, 210, 297, "F");
    pdf.setTextColor("#2e2421");
    pdf.setFont("times", "bold");
    pdf.setFontSize(26);
    pdf.text("Código QR de alta", 105, 32, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Escanea este código para registrarte y añadir tu pase Wallet.", 105, 43, { align: "center" });
    pdf.addImage(qrImage, "PNG", 45, 58, 120, 120);
    pdf.setFontSize(9);
    const wrappedUrl = pdf.splitTextToSize(signupUrl, 160) as string[];
    pdf.text(wrappedUrl, 105, 192, { align: "center" });
    pdf.setDrawColor("#d6a979");
    pdf.line(35, 220, 175, 220);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Voone Wallet", 105, 233, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Coloca este PDF en recepción para que los clientes se den de alta en segundos.", 105, 244, { align: "center" });
    pdf.save("qr-alta-clientes.pdf");
  };

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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Alta de clientes</p>
                <h2 id="signup-qr-title" className="mt-2 font-serif text-3xl font-semibold">Código QR de alta</h2>
                <p className="mt-2 text-sm leading-6 text-[#806d63]">Imprímelo y colócalo en recepción. Al escanearlo, el cliente se da de alta en segundos.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#806d63] hover:bg-[#f6eee8]" aria-label="Cerrar QR">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div ref={qrRef} className="mt-6 flex justify-center">
              <QrCode value={signupUrl} size={240} title="Código QR de alta" />
            </div>
            <p className="mt-4 break-all rounded-2xl bg-[#fffaf6] px-4 py-3 text-center text-xs text-[#806d63]">{signupUrl}</p>

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
