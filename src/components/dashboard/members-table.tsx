"use client";

/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Download, Filter, QrCode, Search, Sparkles, UserPlus, Users, WalletCards } from "lucide-react";

import { EmptyState } from "@/components/shared/page-kit";
import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers, type Member } from "@/lib/api-client";

const columnHelper = createColumnHelper<Member>();

const columns = [
  columnHelper.accessor("name", {
    header: "Member",
    cell: (info) => (
      <div>
        <Link className="font-semibold text-[#2b1a15] hover:text-primary" href={`/dashboard/members/${info.row.original.id}`}>{info.getValue()}</Link>
        <p className="mt-1 text-xs text-muted-foreground">{info.row.original.identity}</p>
      </div>
    ),
  }),
  columnHelper.accessor("templateName", { header: "Template" }),
  columnHelper.accessor("points", { header: "Balance", cell: (info) => <span className="font-serif text-2xl font-semibold">{info.getValue().toLocaleString()}</span> }),
  columnHelper.accessor("tier", { header: "Tier", cell: (info) => <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-bold text-[#7a5526]">{info.getValue()}</span> }),
  columnHelper.display({ header: "Wallet", cell: (info) => <WalletStatusBadges statuses={info.row.original.walletStatus} /> }),
  columnHelper.display({
    header: "Actions",
    cell: (info) => (
      <Button asChild variant="outline" size="sm" className="rounded-xl">
        <Link href={`/dashboard/members/${info.row.original.id}`}>Open</Link>
      </Button>
    ),
  }),
];

export function MembersTable() {
  const [tierFilter, setTierFilter] = useReactState("all");
  const [walletFilter, setWalletFilter] = useReactState("all");
  const [filtersOpen, setFiltersOpen] = useReactState(false);
  const members = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const filteredMembers = (members.data ?? []).filter((member) => {
    const matchesTier = tierFilter === "all" || member.tier === tierFilter;
    const hasGoogle = member.walletStatus.google === "added";
    const hasApple = member.walletStatus.apple === "added";
    const matchesWallet = walletFilter === "all" || (walletFilter === "wallet-ready" && (hasGoogle || hasApple)) || (walletFilter === "needs-wallet" && !hasGoogle && !hasApple);
    return matchesTier && matchesWallet;
  });
  const table = useReactTable({
    data: filteredMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalMembers = members.data?.length ?? 0;
  const walletReady = members.data?.filter((member) => member.walletStatus.google === "added" || member.walletStatus.apple === "added").length ?? 0;
  const totalPoints = members.data?.reduce((total, member) => total + member.points, 0) ?? 0;
  const tiers = Array.from(new Set((members.data ?? []).map((member) => member.tier)));

  if (members.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  if (members.error) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Members could not load. Check the API connection and try again.</div>;
  }

  if (!members.data?.length) {
    return <EmptyState title="No members yet" message="Add your first member and send them a wallet pass from reception." action={{ href: "/dashboard/members/new", label: "Add member" }} />;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard icon={Users} label="Members" value={totalMembers.toLocaleString()} detail={`${filteredMembers.length} in current view`} />
        <MetricCard icon={WalletCards} label="Wallet ready" value={walletReady.toLocaleString()} detail="Google or Apple pass added" />
        <MetricCard icon={Sparkles} label="Point balance" value={totalPoints.toLocaleString()} detail="Across active members" />
      </div>

      <div className="voone-panel p-4 md:p-5">
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, member ID, phone, email, or template"
              className="pl-9"
              value={(table.getState().globalFilter as string | undefined) ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          </div>
          <div className="relative">
            <Button type="button" variant="outline" className="rounded-2xl" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
            {filtersOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-border bg-[#fffaf3] p-4 text-sm shadow-[0_24px_70px_-40px_rgba(67,48,43,0.75)]">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]" htmlFor="member-tier-filter">Tier</label>
                  <select id="member-tier-filter" className="mt-2 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
                    {["all", ...tiers].map((tier) => (
                      <option key={tier} value={tier}>{tier === "all" ? "All tiers" : tier}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]" htmlFor="member-wallet-filter">Wallet</label>
                  <select id="member-wallet-filter" className="mt-2 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm shadow-sm" value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)}>
                    <option value="all">All wallets</option>
                    <option value="wallet-ready">Wallet ready</option>
                    <option value="needs-wallet">Needs wallet</option>
                  </select>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/dashboard/scan"><QrCode className="mr-2 h-4 w-4" /> Scan</Link>
            </Button>
            <Button type="button" variant="outline" className="rounded-2xl">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button asChild className="rounded-2xl">
              <Link href="/dashboard/members/new"><UserPlus className="mr-2 h-4 w-4" /> Add</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#d8c5b6] bg-[#fffaf3]/88 shadow-[0_22px_60px_-46px_rgba(67,48,43,0.72)] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#241612] text-[#fff8ef]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#eadfce]">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/70">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const useReactState = React.useState;

function MetricCard({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; detail: string }) {
  return (
    <div className="voone-panel p-5">
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="voone-kicker">{label}</p>
          <p className="mt-3 font-serif text-4xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#241612] text-gold-light">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}