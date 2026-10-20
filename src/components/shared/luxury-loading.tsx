export function LuxuryLoading({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/55 p-7 text-[#2e2421] shadow-[0_24px_70px_-48px_rgba(67,48,43,0.5)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.9),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(214,169,121,0.22),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.65),rgba(255,250,246,0.28))]" />
      <div className="relative grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Loading</p>
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b7874a]" />
        </div>
        <p className="font-serif text-2xl font-semibold tracking-tight">{label}</p>
        <div className="relative h-3 overflow-hidden rounded-full border border-white/70 bg-white/60 shadow-inner">
          <span className="absolute inset-y-0 left-0 w-1/2 animate-[liquid-loading_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#f1d6bd] via-[#b8864b] to-[#f7eadc]" />
          <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]" />
        </div>
      </div>
      <style>{`@keyframes liquid-loading { 0% { transform: translateX(-110%); } 55% { transform: translateX(80%); } 100% { transform: translateX(230%); } }`}</style>
    </div>
  );
}
