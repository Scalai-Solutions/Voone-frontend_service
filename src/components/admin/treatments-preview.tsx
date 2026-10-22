"use client";

import * as React from "react";

import type { Treatment } from "@/lib/api-client";

function TreatmentRow({ treatment }: { treatment: Treatment }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 px-4 py-3">
      <div>
        <p className="font-semibold">{treatment.name}</p>
        <p className="mt-1 text-xs text-[#806d63]">
          {treatment.priceEuro ? `${treatment.priceEuro} euro` : "No price set"}
        </p>
      </div>
      <span className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
        {treatment.points} points
      </span>
    </div>
  );
}

export function TreatmentsPreview({ treatments }: { treatments: Treatment[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? treatments : treatments.slice(0, 5);

  if (treatments.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[#e4d8d1] bg-[#fffaf6]/70 px-4 py-3 text-sm text-[#806d63]">No treatments saved</p>;
  }

  return (
    <div className="space-y-3">
      {visible.map((treatment) => <TreatmentRow key={treatment.id} treatment={treatment} />)}
      {treatments.length > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-sm font-semibold text-[#754b36] underline-offset-4 hover:underline"
        >
          {expanded ? "View less" : `View all (${treatments.length})`}
        </button>
      ) : null}
    </div>
  );
}
