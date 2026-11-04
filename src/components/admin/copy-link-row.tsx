"use client";

import * as React from "react";
import { Check, Copy, Link2 } from "lucide-react";

/** A read-only value with a copy button, styled like the clinic page's info rows. */
export function CopyLinkRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is still selectable on screen.
    }
  };

  return (
    <div className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4">
      <Link2 className="h-4 w-4 text-[#a47845]" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 break-all text-sm font-semibold">{value}</p>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
          className="shrink-0 rounded-full border border-[#ded2cb] p-2 text-[#806d63] hover:bg-white"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
