"use client";

import { ChevronRight } from "lucide-react";

import { cardClass } from "@/components/admin/change-requests/chips";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicketComparison } from "@/features/change-requests/api/useAdminChangeRequests";
import {
  hasTicketFlag,
  type AdminTicketFlag,
  type ChangeRequestType,
} from "@/lib/admin-change-requests";
import {
  ticketFlagHeadline,
  ticketFlagRows,
  ticketFlagUnavailable,
} from "@/lib/admin-ticket-flag";
import { deltaKind } from "@/components/admin/program/comparison";
import { cn } from "@/lib/utils";

/**
 * What a reward or price ticket would do to the clinic's 5-year plan, exact, against the live
 * plan and against our recommendation. For admins only.
 *
 * Calm on purpose, like the plan comparison banner: better than the live plan is a soft green,
 * worse is amber (never red, nothing here is an error), equal is neutral. It states numbers and
 * never tells anyone what to do. Types with no flag render nothing and ask for nothing.
 */

type Tone = "positive" | "negative" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  positive: "border-success/30 bg-success/10",
  negative: "border-warning/40 bg-warning/10",
  neutral: "border-border bg-secondary/60",
};

/** Year 5 against the live plan: the same judgement the headline makes. */
const toneOf = (flag: AdminTicketFlag): Tone => {
  const final = [...flag.years].sort((a, b) => a.year - b.year).at(-1);
  const kind = final ? deltaKind(final.vsLive.euros) : "same";

  return kind === "more" ? "positive" : kind === "less" ? "negative" : "neutral";
};

const LABEL = "What it would do to the plan";

export function TicketFlag({
  id,
  type,
  variant,
}: {
  id: string;
  type: ChangeRequestType;
  /** `card` stands alone on the ticket page; `inline` sits inside another panel. */
  variant: "card" | "inline";
}) {
  const enabled = hasTicketFlag(type);
  const query = useTicketComparison(id, enabled);

  if (!enabled) return null;

  const label = (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">{LABEL}</p>
  );
  const body = (
    // Always mounted, so a screen reader hears the sentence arrive.
    <div aria-live="polite" className={variant === "card" ? "mt-3" : "mt-2"}>
      <FlagBody query={query} />
    </div>
  );

  return variant === "card" ? (
    <section aria-label={LABEL} className={cardClass}>
      {label}
      {body}
    </section>
  ) : (
    <div>
      {label}
      {body}
    </div>
  );
}

function FlagBody({ query }: { query: ReturnType<typeof useTicketComparison> }) {
  if (query.isPending) {
    return (
      <div
        role="status"
        aria-label="Loading the comparison"
        className="grid gap-2 rounded-lg border border-border p-4"
      >
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  // A failed background refetch keeps showing the last good data: the error is only for no data.
  if (!query.data) {
    return <p className="text-sm text-[#806d63]">Comparison unavailable</p>;
  }

  const flag = query.data;
  const unavailable = ticketFlagUnavailable(flag);

  if (flag.status !== "ok") {
    return <p className="text-sm text-[#806d63]">{unavailable}</p>;
  }

  return (
    <div className={cn("grid gap-2 rounded-lg border p-4 text-sm", TONE_CLASS[toneOf(flag)])}>
      <p className="font-medium leading-6">{ticketFlagHeadline(flag)}</p>
      {flag.reason ? <p className="text-xs text-muted-foreground">{flag.reason}</p> : null}

      <details className="group text-xs">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground hover:text-foreground">
          <ChevronRight
            className="h-3 w-3 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
          <span>See by year</span>
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <caption className="sr-only">
              Cumulative net by year: the live plan, with this change, and the difference from the
              live plan and from our recommendation
            </caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1 pr-4 font-semibold">
                  Year
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  Live plan
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  With this change
                </th>
                <th scope="col" className="py-1 pr-4 text-right font-semibold">
                  vs live
                </th>
                <th scope="col" className="py-1 text-right font-semibold">
                  vs recommended
                </th>
              </tr>
            </thead>
            <tbody>
              {ticketFlagRows(flag).map((row) => (
                <tr key={row.year} className="border-t border-border/60">
                  <th scope="row" className="py-1 pr-4 font-normal">
                    {row.year}
                  </th>
                  <td className="py-1 pr-4 text-right tabular-nums">{row.live}</td>
                  <td className="py-1 pr-4 text-right tabular-nums">{row.proposed}</td>
                  <td className="py-1 pr-4 text-right tabular-nums">{row.vsLive}</td>
                  <td className="py-1 text-right tabular-nums">{row.vsRecommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
