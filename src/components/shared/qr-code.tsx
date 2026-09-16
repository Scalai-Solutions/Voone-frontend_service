"use client";

import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

/**
 * A real, scannable QR code.
 *
 * Replaces three separate hand-rolled CSS grids that looked like QR codes and encoded
 * nothing — which meant the scan-and-credit loop had no working artifact even though the
 * scanner itself was real.
 *
 * SVG rather than canvas: the sign-up code gets printed and taped to a reception desk, and
 * only SVG stays sharp at poster size. Level "M" is the usual print choice — it tolerates
 * roughly 15% damage, which matters for something handled and scuffed all day.
 */
export function QrCode({
  value,
  size = 176,
  className,
  title,
}: {
  value: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("w-fit rounded-lg bg-white p-3 shadow-inner", className)}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={2}
        // Pure black on white: brand-tinted codes reduce the contrast scanners rely on.
        bgColor="#ffffff"
        fgColor="#000000"
        // Rendered as an accessible image rather than decoration — the value is the
        // information, and a sighted user can read the caption instead.
        title={title ?? value}
      />
    </div>
  );
}
