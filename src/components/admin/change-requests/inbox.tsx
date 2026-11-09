"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox as InboxIcon, Loader2, MessageCircle, Search } from "lucide-react";

import {
  AutoChip,
  StatusChip,
  TypeChip,
  cardClass,
  errorText,
} from "@/components/admin/change-requests/chips";
import { Input } from "@/components/ui/input";
import { useClinics } from "@/features/clinics/api/useClinics";
import {
  useInboxList,
  useStatusCounts,
  type InboxFilters,
} from "@/features/change-requests/api/useAdminChangeRequests";
import { formatTimestamp } from "@/lib/change-request-describe";
import {
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_TYPES,
  STATUS_LABEL,
  TYPE_LABEL,
  chipCount,
  type ChangeRequestType,
} from "@/lib/admin-change-requests";

/**
 * The tickets inbox: across all clinics, or one clinic when `clinicId` is given. Filters are
 * a status chip row (with counts), a type select and a text search (title or clinic name).
 */
export function ChangeRequestsInbox({ clinicId: fixedClinicId }: { clinicId?: string }) {
  const [status, setStatus] = React.useState<InboxFilters["status"]>("ACTIVE");
  const [type, setType] = React.useState<InboxFilters["type"]>("");
  const [pickedClinic, setPickedClinic] = React.useState("");
  const [text, setText] = React.useState("");
  const [q, setQ] = React.useState("");
  // On a clinic's own page the clinic is fixed; in the global inbox it is a filter.
  const clinicId = fixedClinicId ?? (pickedClinic || undefined);
  const clinics = useClinics();

  // The text filter applies after a pause, so typing does not fire a request per key.
  React.useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 300);

    return () => clearTimeout(timer);
  }, [text]);

  const list = useInboxList(clinicId, { status, type, q });
  const counts = useStatusCounts(clinicId);
  const rows = list.rows;

  const chips: Array<{ value: InboxFilters["status"]; label: string }> = [
    { value: "", label: "All" },
    { value: "ACTIVE", label: "Active" },
    ...CHANGE_REQUEST_STATUSES.map((value) => ({
      value,
      label: STATUS_LABEL[value],
    })),
  ];

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {chips.map((chip) => {
            const count = chipCount(chip.value, counts);

            return (
              <button
                key={chip.value || "all"}
                type="button"
                aria-pressed={status === chip.value}
                onClick={() => setStatus(chip.value)}
                className={chipButton(status === chip.value)}
              >
                {chip.label}
                <span className="ml-1.5 tabular-nums opacity-70">{count ?? "–"}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(event) => setType(event.target.value as ChangeRequestType | "")}
            className="h-11 rounded-2xl border border-[#d9c9b6] bg-[#fffaf3]/86 px-3 text-sm"
          >
            <option value="">All types</option>
            {CHANGE_REQUEST_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABEL[value]}
              </option>
            ))}
          </select>
          {fixedClinicId ? null : (
            <select
              aria-label="Filter by clinic"
              value={pickedClinic}
              onChange={(event) => setPickedClinic(event.target.value)}
              className="h-11 max-w-60 rounded-2xl border border-[#d9c9b6] bg-[#fffaf3]/86 px-3 text-sm"
            >
              <option value="">All clinics</option>
              {(clinics.data ?? []).map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={120}
              placeholder={clinicId ? "Search requests by title" : "Search by title or clinic name"}
              aria-label="Search requests"
              className="h-11 rounded-2xl border-[#d9c9b6] bg-[#fffaf3]/86 pl-9 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        {list.isPending ? (
          <p className="flex items-center gap-2 text-sm text-[#806d63]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading requests...
          </p>
        ) : null}
        {list.isError ? (
          <p role="alert" className="text-sm font-semibold text-[#b94135]">
            {errorText(list.error, "Could not load the requests.")}
          </p>
        ) : null}
        {list.loaded && rows.length === 0 ? (
          <div className="py-6 text-center text-sm text-[#806d63]">
            <InboxIcon className="mx-auto mb-2 h-5 w-5" />
            No requests match these filters.
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/customer-care/${encodeURIComponent(row.id)}`}
                  className="block rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4 transition hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{row.title}</p>
                      <p className="mt-1 text-xs text-[#8c7870]">
                        {row.clinic.name} · Created {formatTimestamp(row.createdAt)}
                        {row.lastMessageAt
                          ? ` · Last message ${formatTimestamp(row.lastMessageAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeChip type={row.type} />
                      <StatusChip status={row.status} />
                      {row.autoApproved ? <AutoChip /> : null}
                      <span
                        className="inline-flex items-center gap-1 text-xs text-[#8c7870]"
                        title="Messages"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {row.messageCount}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {list.hasNextPage ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => void list.fetchNextPage()}
              disabled={list.isFetchingNextPage}
              className="rounded-full border border-[#cdb9aa] px-5 py-2 text-sm font-semibold text-[#754b36] disabled:opacity-60"
            >
              {list.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          </div>
        ) : null}
        {list.isFetchNextPageError ? (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-[#b94135]">
            {errorText(list.error, "Could not load more requests.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const chipButton = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "border-[#2d211e] bg-[#2d211e] text-white"
      : "border-[#d9c9b6] bg-[#fffaf3] text-[#6f4d3f] hover:bg-white"
  }`;
