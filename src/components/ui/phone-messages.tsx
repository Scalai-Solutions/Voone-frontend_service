"use client";

import { useState } from "react";

const messages = [
  {
    icon: "💧",
    clinic: "Clínica Auréa",
    time: "ahora",
    text: "Hola Marta, tu Hydrafacial pide repetición. ¿Te reservamos esta semana?",
  },
  {
    icon: "✨",
    clinic: "Clínica Auréa",
    time: "hace 2 h",
    text: "Lucía, han pasado 3 semanas de tu láser. Toca la siguiente sesión.",
  },
  {
    icon: "🎁",
    clinic: "Clínica Auréa",
    time: "ayer",
    text: "Carlos, tu bono de maderoterapia caduca pronto. Te guardamos hueco.",
  },
];

export function PhoneMessages() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative mx-auto cursor-pointer select-none"
      style={{ width: 300, height: 610 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      role="button"
      tabIndex={0}
      aria-label="Ver mensajes del centro"
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((o) => !o)}
    >
      {/* iPhone body */}
      <div className="absolute inset-0 rounded-[48px] bg-[#0c0906] p-[11px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
        {/* Screen — dark warm wallpaper, distinct from the section */}
        <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-gradient-to-b from-[#3a2b24] via-[#271d18] to-[#140f0c]">
          <div className="pointer-events-none absolute -top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#b98a4f]/25 blur-3xl" />

          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-30 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="relative z-20 flex items-center justify-between px-7 pt-4 text-[11px] font-semibold text-white/90">
            <span>9:41</span>
            <span className="tracking-tight text-gold-light">Auréa</span>
          </div>

          {/* Lock-screen clock */}
          <div className="relative z-20 mt-3 text-center text-white">
            <p className="text-[12px] font-medium text-gold-light">martes 14 de octubre</p>
            <p className="font-serif text-6xl leading-none tracking-tight">9:41</p>
          </div>

          {/* Notification stack — collapsed: fixed-height so all 3 step down; open: fans out full */}
          <div className="absolute inset-x-0 bottom-0 top-[172px] px-4">
            {messages.map((m, i) => (
              <div
                key={m.text}
                className="absolute left-4 right-4 h-[112px] overflow-hidden rounded-[22px] border border-white/40 bg-white/90 p-3.5 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md"
                style={{
                  zIndex: i,
                  transform: `translateY(${i * (open ? 126 : 46)}px)`,
                  transformOrigin: "top center",
                  transition: "transform 520ms cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f3e7db] to-[#e4c9b6] text-sm shadow-inner">
                    {m.icon}
                  </span>
                  <span className="text-[12px] font-semibold text-[#3d2b28]">{m.clinic}</span>
                  <span className="ml-auto text-[10px] text-[#a08b80]">{m.time}</span>
                </div>
                <p className="line-clamp-3 text-[12.5px] leading-snug text-[#5a4038]">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Hint */}
          <div className="absolute inset-x-0 bottom-4 z-20 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            {open ? "Mensajes de tu centro" : "Toca para ver los avisos"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMessages;
