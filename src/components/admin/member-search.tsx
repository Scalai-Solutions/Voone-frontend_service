"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getMembers } from "@/lib/api-client";

export function AdminMemberSearch() {
  const [search, setSearch] = React.useState("");
  const members = useQuery({ queryKey: ["admin-members"], queryFn: getMembers });
  const filtered = members.data?.filter((member) => `${member.name} ${member.id} ${member.identity}`.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (members.isLoading) return <Skeleton className="h-72 w-full" />;
  if (members.error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Members could not load.</div>;

  return (
    <div className="space-y-4">
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email, or member ID" className="max-w-xl" />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Clinic template</th>
                <th className="px-4 py-3 font-semibold">Points</th>
                <th className="px-4 py-3 font-semibold">Wallet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/members/${member.id}`} className="font-medium text-primary hover:underline">{member.name}</Link>
                    <p className="text-xs text-muted-foreground">{member.id} - {member.identity}</p>
                  </td>
                  <td className="px-4 py-3">{member.templateName}</td>
                  <td className="px-4 py-3">{member.points.toLocaleString()}</td>
                  <td className="px-4 py-3"><WalletStatusBadges statuses={member.walletStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}