import * as React from "react";

import { IconTip } from "@/components/ui/icon-tip";
import {
  FLAG_FOOTNOTE,
  UNPRICED_BODY,
  UNPRICED_LABEL,
  cellTip,
  fiveYearSentence,
  markGlyph,
  signalCopy,
  type Baseline,
  type Mark,
  type OwnerCell,
  type OwnerFlag,
} from "@/lib/change-flag";
import { cn } from "@/lib/utils";

/**
 * What a reward or a price would do to the plan, in the owner's blurred terms: a signal line,
 * a row of year marks per baseline (each with its tooltip) and the footnote. `none` renders
 * nothing, so a missing answer never gets in the way of the form. All the words come from
 * src/lib/change-flag.ts; this file only lays them out. It never computes a euro.
 */

const TONE = {
  good: { dot: "bg-success", text: "text-success" },
  "costs-more": { dot: "bg-warning", text: "text-warning" },
  similar: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
} as const;

const MARK_TONE: Record<Mark, string> = {
  up: "text-success",
  down: "text-warning",
  same: "text-muted-foreground",
};

function MarksRow({
  label,
  cells,
  baseline,
}: {
  label: string;
  cells: OwnerCell[];
  baseline: Baseline;
}) {
  return (
    <tr>
      <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-muted-foreground">
        {label}
      </th>
      {cells.map((cell) => {
        const tip = cellTip(cell, baseline);

        return (
          <td key={cell.year} className="px-0.5 py-1 text-center">
            <IconTip label={tip} focusable>
              <span
                role="img"
                aria-label={tip}
                className={cn(
                  "inline-block cursor-default rounded-md px-2.5 py-1 text-base leading-none hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  MARK_TONE[cell.mark],
                )}
              >
                {markGlyph(cell.mark)}
              </span>
            </IconTip>
          </td>
        );
      })}
    </tr>
  );
}

export function ChangeFlag({ flag, className }: { flag: OwnerFlag; className?: string }) {
  if (flag.status === "none") return null;

  if (flag.status === "unpriced") {
    return (
      <div className={cn("rounded-2xl bg-white/70 px-4 py-3 text-sm", className)} aria-live="polite">
        <p className="flex items-center gap-2 font-bold text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground" aria-hidden="true" />
          {UNPRICED_LABEL}
        </p>
        <p className="mt-1 text-muted-foreground">{UNPRICED_BODY}</p>
      </div>
    );
  }

  const copy = signalCopy(flag.signal);
  const tone = TONE[copy.tone];
  const sentence = fiveYearSentence(flag);

  return (
    <div className={cn("rounded-2xl bg-white/70 px-4 py-3 text-sm", className)}>
      {/* Only the signal line is announced; the marks table is static content. */}
      <p aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("inline-block h-2.5 w-2.5 rounded-full", tone.dot)} aria-hidden="true" />
        <strong className={tone.text}>{copy.label}</strong>
        {sentence ? <span className="text-muted-foreground">· {sentence}</span> : null}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full max-w-md border-collapse text-[13px]">
          <caption className="sr-only">Comparación año a año</caption>
          <thead>
            <tr className="text-muted-foreground">
              <td />
              {flag.vsCurrent.map((cell) => (
                <th key={cell.year} scope="col" className="px-0.5 pb-1 text-center text-xs font-normal">
                  Año {cell.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MarksRow label="Frente a tu plan actual" cells={flag.vsCurrent} baseline="current" />
            {flag.vsRecommended ? (
              <MarksRow label="Frente a Voone" cells={flag.vsRecommended} baseline="recommended" />
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        ▲ mejor &nbsp; ＝ igual &nbsp; ▼ peor &nbsp;·&nbsp; {FLAG_FOOTNOTE}
      </p>
    </div>
  );
}
