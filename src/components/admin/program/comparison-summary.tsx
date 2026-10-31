"use client";

import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramComparison } from "@/lib/onboarding-api";
import { cn } from "@/lib/utils";
import {
  comparisonHeadline,
  comparisonReason,
  comparisonRows,
  comparisonTone,
  type ComparisonTone,
} from "./comparison";

/**
 * The 5-year money consequence of the plan as it stands, against the recommended one. Shown to
 * admins only, in the banner while a draft is edited and again before it is published.
 *
 * Calm on purpose: better than recommended is a soft green, worse is amber (never red, nothing
 * here is an error), equal is neutral. It states a number and never tells anyone what to do.
 *
 * `banner` shows nothing when the comparison cannot load; `confirm` says so, muted, because the
 * person must still be able to publish.
 */

const TONE_CLASS: Record<ComparisonTone, string> = {
  positive: "border-success/30 bg-success/10",
  negative: "border-warning/40 bg-warning/10",
  neutral: "border-border bg-secondary/60",
  unavailable: "border-border bg-secondary/40 text-muted-foreground",
};

export function ComparisonSummary({
  comparison,
  loading,
  failed,
  variant,
}: {
  comparison: ProgramComparison | undefined;
  loading: boolean;
  failed: boolean;
  variant: "banner" | "confirm";
}) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading the comparison with our recommended plan"
        className="grid gap-2 rounded-lg border border-border p-4"
      >
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (failed || !comparison) {
    return variant === "confirm" ? (
      <p className="text-sm text-muted-foreground">Comparison unavailable</p>
    ) : null;
  }

  const headline = comparisonHeadline(comparison);
  const tone = comparisonTone(comparison);
  const rows = headline ? comparisonRows(comparison) : [];

  return (
    <section
      aria-label="Comparison with our recommended plan"
      className={cn(
        "grid gap-2 rounded-lg border p-4 text-sm",
        TONE_CLASS[tone],
      )}
    >
      <p className={cn("leading-6", headline && "font-medium")}>
        {headline ??
          comparisonReason(comparison) ??
          "There is no recommended plan to compare with."}
      </p>

      {rows.length > 0 ? (
        <details className="group text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground hover:text-foreground">
            <ChevronRight
              className="h-3 w-3 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            <span>See by year</span>
          </summary>
          <table className="mt-2 w-full max-w-xl text-left">
            <caption className="sr-only">
              Cumulative net by year, recommended plan and this plan
            </caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-4 font-semibold">
                  Year
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  Recommended plan, cumulative net
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  This plan, cumulative net
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className="border-t border-border/60">
                  <th scope="row" className="py-1 pr-4 font-normal">
                    {row.year}
                  </th>
                  <td className="py-1 pr-4 text-right tabular-nums">
                    {row.recommended}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {row.thisPlan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}
