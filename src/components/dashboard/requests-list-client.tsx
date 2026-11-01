"use client";

import * as React from "react";
import Link from "next/link";

import {
  StatusChip,
  TypeChip,
} from "@/components/dashboard/request-chips";
import { useChangeRequestList } from "@/features/change-requests/api/useChangeRequests";
import {
  STATUS_LABELS,
  formatRequestDate,
  lastActivity,
} from "@/lib/change-request-display";
import {
  CHANGE_REQUEST_STATUSES,
  type ChangeRequestStatus,
} from "@/lib/staff-change-requests";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ value: ChangeRequestStatus | null; label: string }> = [
  { value: null, label: "Todas" },
  ...CHANGE_REQUEST_STATUSES.map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
];

/** Mis solicitudes: every change request of the centre, newest first, filtered by status. */
export function RequestsListClient() {
  const [status, setStatus] = React.useState<ChangeRequestStatus | null>(null);
  const list = useChangeRequestList(status);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="text-[#2e2421]">
      <Link
        href="/dashboard/templates"
        className="text-sm font-semibold text-[#9b633e] underline-offset-2 hover:underline"
      >
        ← Mi centro
      </Link>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">
        Cambios en tu centro
      </p>
      <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">
        Mis solicitudes
      </h1>
      <p className="mt-3 max-w-xl text-[#927e72]">
        Los cambios que has pedido a Voone en servicios, recompensas y niveles, y
        cómo van.
      </p>

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="mt-7 flex flex-wrap gap-1 rounded-2xl border border-[#e2d5cc] bg-white/60 p-1 sm:w-fit"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              status === filter.value
                ? "bg-[#2d211e] text-white shadow-sm"
                : "text-[#806b60] hover:bg-[#f4e9df]",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-[#e2d5cc] bg-white/80">
        {list.isPending ? (
          <p className="px-5 py-4 text-sm text-[#927e72]">
            Cargando solicitudes...
          </p>
        ) : null}
        {list.isError ? (
          <p
            role="alert"
            className="px-5 py-4 text-sm font-semibold text-[#b94135]"
          >
            No se pudieron cargar las solicitudes.
          </p>
        ) : null}
        {list.data && items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#927e72]">
            {status
              ? "No hay solicitudes con este estado."
              : "Todavía no has hecho ninguna solicitud. Puedes pedir un cambio desde Mi centro."}
          </p>
        ) : null}

        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="border-b border-[#eadfd8] last:border-0"
            >
              <Link
                href={`/dashboard/requests/${encodeURIComponent(item.id)}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#fffaf6]"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-[#927e72]">
                    Creada el {formatRequestDate(item.createdAt)} · Última
                    actividad el {formatRequestDate(lastActivity(item))}
                    {item.messageCount > 0
                      ? ` · ${item.messageCount} mensaje${item.messageCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TypeChip type={item.type} />
                  <StatusChip status={item.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {list.hasNextPage ? (
          <div className="border-t border-[#eadfd8] p-4 text-center">
            <button
              type="button"
              onClick={() => void list.fetchNextPage()}
              disabled={list.isFetchingNextPage}
              className="rounded-full border border-[#cdb9aa] px-5 py-2 text-sm font-semibold text-[#754b36] disabled:opacity-60"
            >
              {list.isFetchingNextPage ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
