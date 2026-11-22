import { percentage } from "@/lib/member-metrics";
import { cn } from "@/lib/utils";

/**
 * The metric tiles, bars and rankings of the clinic's metrics page, shared with the admin's
 * per-clinic analytics page so both read the same.
 */

const tierStyles: Record<string, string> = {
  Diamond: "bg-[#d9e5ef] text-[#30465d]",
  Gold: "bg-[#f2d09a] text-[#68451f]",
  Silver: "bg-[#d8d8d4] text-[#4d4e4a]",
  Nuevo: "bg-[#eadfd8] text-[#6f5c53]",
};

export function MetricCard({ icon: Icon, eyebrow, value, detail, tone = "light" }: { icon: React.ComponentType<{ className?: string }>; eyebrow: string; value: string; detail: string; tone?: "dark" | "light" }) {
  return (
    <section className={cn("rounded-3xl p-5", tone === "dark" ? "bg-[#2d211e] text-white" : "border border-[#e2d5cc] bg-white/80 text-[#2e2421]")}>
      <div className="flex items-center justify-between gap-4">
        <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", tone === "dark" ? "text-[#dcb17b]" : "text-[#b7874a]")}>{eyebrow}</p>
        <Icon className={cn("h-5 w-5", tone === "dark" ? "text-[#dcb17b]" : "text-[#b8864b]")} />
      </div>
      <p className="mt-4 font-serif text-4xl font-semibold">{value}</p>
      <p className={cn("mt-2 text-sm", tone === "dark" ? "text-[#c9b7ad]" : "text-[#927e72]")}>{detail}</p>
    </section>
  );
}

export function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = percentage(value, total);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-[#806d63]">{value} miembros</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#eadfd8]">
        <div className="h-full rounded-full bg-[#9c7651]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function TierTile({ tier, count, total }: { tier: string; count: number; total: number }) {
  return (
    <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold", tierStyles[tier] ?? "bg-[#eadfd8] text-[#6f5c53]")}>{tier}</span>
        <span className="font-serif text-3xl font-semibold">{count}</span>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-[#eadfd8]">
        <div className="h-full rounded-full bg-[#b8864b]" style={{ width: `${percentage(count, total)}%` }} />
      </div>
      <p className="mt-2 text-xs text-[#927e72]">{percentage(count, total)}% de la base</p>
    </div>
  );
}

export function RankingCard({ title, eyebrow, icon: Icon, rows, emptyText }: { title: string; eyebrow: string; icon: React.ComponentType<{ className?: string }>; rows: Array<{ id: string; name: string; detail: string; value: string }>; emptyText: string }) {
  return (
    <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{eyebrow}</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-[#b8864b]" />
      </div>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row, index) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{index + 1}. {row.name}</p>
              <p className="mt-1 text-xs text-[#927e72]">{row.detail}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-bold text-[#805637]">{row.value}</span>
          </div>
        )) : <p className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3 text-sm text-[#806d63]">{emptyText}</p>}
      </div>
    </section>
  );
}
