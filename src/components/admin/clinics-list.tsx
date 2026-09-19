"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, ListFilter, MapPin, MoreHorizontal, Search, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { EmptyState } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getClinics } from "@/lib/api-client";

function formatPlan(plan: string) {
  if (plan === "Launch") return "Lanzamiento";
  if (plan === "Growth") return "Crecimiento";
  if (plan === "Enterprise") return "Empresa";
  return plan;
}

export function ClinicsList() {
  const [search, setSearch] = React.useState("");
  const reducedMotion = useReducedMotion();
  const clinics = useQuery({ queryKey: ["clinics"], queryFn: getClinics });
  const filtered = clinics.data?.filter((clinic) => `${clinic.name} ${clinic.city} ${clinic.plan} ${formatPlan(clinic.plan)}`.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (clinics.isLoading) return <Skeleton className="h-72 w-full" />;
  if (clinics.error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">No se pudieron cargar las clínicas.</div>;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <ClinicSummary label="Total estimate" value="$32.1k" details={["Accepted", "Pending", "Canceled"]} />
        <ClinicSummary label="Total clinics" value={(clinics.data?.length ?? 0).toLocaleString()} details={["Active + setup"]} />
        <ClinicSummary label="Total members" value={(clinics.data?.reduce((total, clinic) => total + clinic.members, 0) ?? 0).toLocaleString()} details={["Across programs"]} />
      </section>

      <div className="flex flex-col gap-3 border-b border-[#ded2cb] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar clínicas o planes" className="h-11 rounded-2xl border-[#d9c9b6] bg-[#fffaf3]/86 pl-9 shadow-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-2xl"><ListFilter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button asChild className="rounded-2xl">
            <Link href="/admin/onboarding">Start onboarding</Link>
          </Button>
        </div>
      </div>
      {filtered.length ? (
        <motion.div
          className="overflow-hidden rounded-[24px] border border-[#ded2cb] bg-white/78 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl"
          initial={reducedMotion ? false : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="hidden grid-cols-[44px_minmax(220px,1.2fr)_minmax(180px,0.9fr)_140px_150px_120px] items-center gap-4 border-b border-[#e7ddd7] bg-[#fffaf6]/82 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8c7870] lg:grid">
            <span />
            <span>Profile</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Estimate value</span>
            <span />
          </div>
          {filtered.map((clinic) => (
            <motion.div key={clinic.id} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1] } } }}>
              <Link href={`/admin/clinics/${clinic.id}`} className="grid gap-4 border-b border-[#ede4de] px-5 py-4 text-sm transition last:border-b-0 hover:bg-[#f5efeb] lg:grid-cols-[44px_minmax(220px,1.2fr)_minmax(180px,0.9fr)_140px_150px_120px] lg:items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#201715] text-[#f1d6bd]"><Building2 className="h-4 w-4" /></span>
                <span>
                  <span className="block font-semibold text-[#2e2421]">{clinic.name}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-[#8c7870]"><MapPin className="h-3 w-3" /> {clinic.city} · {formatPlan(clinic.plan)}</span>
                </span>
                <span className="text-xs text-[#6f625d]">
                  <span className="block">owner@{clinic.id.replace("clinic-", "")}.voone.test</span>
                  <span className="mt-1 block">+34 600 12 {clinic.members.toString().padStart(3, "0")}</span>
                </span>
                <Badge variant={clinic.status === "active" ? "default" : "secondary"} className="w-fit capitalize">{clinic.status === "active" ? "Accepted" : "Pending"}</Badge>
                <span className="font-semibold">$ {(clinic.members * 86).toLocaleString("en-US")}.00</span>
                <span className="flex items-center gap-3 text-[#8c7870]"><Users className="h-4 w-4" /> {clinic.members}<MoreHorizontal className="ml-auto h-4 w-4" /><ArrowUpRight className="h-4 w-4" /></span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState title="No se encontraron clínicas" message="Prueba otra búsqueda o da de alta la siguiente clínica." action={{ href: "/admin/clinics/new", label: "Dar de alta clínica" }} />
      )}
    </div>
  );
}

function ClinicSummary({ label, value, details }: { label: string; value: string; details: string[] }) {
  return (
    <Card className="rounded-[8px] border-[#ded2cb] bg-white/78 shadow-[0_18px_45px_-36px_rgba(60,38,23,0.55)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-[#2e2421]">{label}<MoreHorizontal className="h-4 w-4 text-[#8c7870]" /></CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-4xl font-semibold tracking-tight">{value}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#8c7870]">
          {details.map((detail) => <span key={detail} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#0f9f8f]" /> {detail}</span>)}
        </div>
      </CardContent>
    </Card>
  );
}