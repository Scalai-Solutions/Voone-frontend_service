"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { WalletStatusBadges } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMember } from "@/lib/api-client";

export function MemberDetail({ memberId }: { memberId: string }) {
  const [deactivated, setDeactivated] = useState(false);
  const member = useQuery({ queryKey: ["member", memberId], queryFn: () => getMember(memberId) });

  if (member.isLoading) return <Skeleton className="h-80 w-full" />;
  if (member.error || !member.data) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Member could not load.</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{member.data.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Member ID</p>
            <p className="text-lg font-semibold">{member.data.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current points</p>
            <p className="text-3xl font-semibold tracking-tight">{member.data.points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tier</p>
            <p className="font-medium">{member.data.tier}</p>
          </div>
          <WalletStatusBadges statuses={member.data.walletStatus} />
          {deactivated ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">Member marked inactive locally.</p> : null}
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (window.confirm("Deactivate this member? Their pass will stop earning points.")) {
                setDeactivated(true);
              }
            }}
          >
            Deactivate member
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {member.data.history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border bg-background/70 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground">{item.date}</p>
              </div>
              <span className="font-semibold text-success">+{item.points}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}