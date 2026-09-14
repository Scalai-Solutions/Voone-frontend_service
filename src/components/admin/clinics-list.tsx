"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { EmptyState } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getClinics } from "@/lib/api-client";

export function ClinicsList() {
  const [search, setSearch] = React.useState("");
  const reducedMotion = useReducedMotion();
  const clinics = useQuery({ queryKey: ["clinics"], queryFn: getClinics });
  const filtered = clinics.data?.filter((clinic) => `${clinic.name} ${clinic.city} ${clinic.plan}`.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (clinics.isLoading) return <Skeleton className="h-72 w-full" />;
  if (clinics.error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Clinics could not load.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clinics or plans" className="h-11 rounded-2xl border-[#d9c9b6] bg-[#fffaf3]/86 pl-9 shadow-sm" />
        </div>
        <Button asChild className="rounded-2xl">
          <Link href="/admin/clinics/new">Onboard clinic</Link>
        </Button>
      </div>
      {filtered.length ? (
        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {filtered.map((clinic) => (
            <motion.div key={clinic.id} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } } }}>
            <Card className="group h-full overflow-hidden rounded-[24px] border-[#d9c9b6] bg-[#fffaf3]/90 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.74)] transition-transform duration-300 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a1b16] text-gold-light shadow-[0_14px_30px_-20px_rgba(42,27,22,0.9)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-4 font-serif text-2xl tracking-tight">{clinic.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{clinic.city}</p>
                  </div>
                  <Badge variant={clinic.status === "active" ? "default" : "secondary"} className="capitalize">{clinic.status === "active" ? "Active" : "Setup"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-[#d9c9b6] bg-white/62 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Plan</p>
                  <p className="mt-1 flex items-center gap-2 font-serif text-2xl font-semibold text-foreground"><Sparkles className="h-4 w-4 text-gold" />{clinic.plan}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  <div className="rounded-2xl bg-secondary/78 p-3"><span className="flex items-center gap-2 text-2xl font-semibold"><Users className="h-4 w-4 text-gold" />{clinic.members}</span><span className="text-xs text-muted-foreground">Members</span></div>
                  <div className="rounded-2xl bg-secondary/78 p-3"><span className="block text-2xl font-semibold">{clinic.templates}</span><span className="text-xs text-muted-foreground">Templates</span></div>
                </div>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link href={`/admin/clinics/${clinic.id}`}>Open clinic</Link>
                </Button>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState title="No clinics found" message="Try a different search, or onboard the next clinic." action={{ href: "/admin/clinics/new", label: "Onboard clinic" }} />
      )}
    </div>
  );
}