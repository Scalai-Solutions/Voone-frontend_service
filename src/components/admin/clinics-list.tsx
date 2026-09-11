"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getClinics } from "@/lib/api-client";

export function ClinicsList() {
  const [search, setSearch] = React.useState("");
  const clinics = useQuery({ queryKey: ["clinics"], queryFn: getClinics });
  const filtered = clinics.data?.filter((clinic) => `${clinic.name} ${clinic.city}`.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (clinics.isLoading) return <Skeleton className="h-72 w-full" />;
  if (clinics.error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Clinics could not load.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clinics" className="max-w-sm" />
        <Button asChild>
          <Link href="/admin/clinics/new">Onboard clinic</Link>
        </Button>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((clinic) => (
            <Card key={clinic.id} className="rounded-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <Badge variant={clinic.status === "active" ? "default" : "secondary"}>{clinic.status === "active" ? "Active" : "Setup"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>{clinic.city} - {clinic.plan}</p>
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  <div className="rounded-md bg-secondary p-3"><span className="block text-2xl font-semibold">{clinic.members}</span><span className="text-xs text-muted-foreground">Members</span></div>
                  <div className="rounded-md bg-secondary p-3"><span className="block text-2xl font-semibold">{clinic.templates}</span><span className="text-xs text-muted-foreground">Templates</span></div>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/admin/clinics/${clinic.id}`}>Open clinic</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No clinics found" message="Try a different search, or onboard the next clinic." action={{ href: "/admin/clinics/new", label: "Onboard clinic" }} />
      )}
    </div>
  );
}