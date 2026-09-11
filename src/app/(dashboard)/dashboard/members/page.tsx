import { MembersTable } from "@/components/dashboard/members-table";

export default function MembersPage() {
  return (
    <div className="space-y-5">
      <section className="voone-dark-panel px-5 py-6 md:px-8">
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative max-w-3xl">
          <p className="voone-kicker">Member operations</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">Every pass holder in one view.</h1>
          <p className="mt-3 text-sm leading-6 text-white/58 md:text-base">Search, segment, inspect wallet readiness, and jump into member actions without losing reception context.</p>
        </div>
      </section>
      <MembersTable />
    </div>
  );
}