import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="voone-fade-up mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a47845]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold tracking-wide text-foreground md:text-4xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function StatCard({ label, value, detail, className }: { label: string; value: string; detail?: string; className?: string }) {
  return (
    <Card className={cn("group rounded-lg border-[#d9c9b6] bg-[#fffaf3]/90 shadow-[0_18px_45px_-32px_rgba(60,38,23,0.55)] transition-transform duration-300 hover:-translate-y-1", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a47845]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-serif text-4xl font-semibold tracking-wide">{value}</div>
        {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/70 p-8 text-center">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {action ? (
        <Button asChild className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}