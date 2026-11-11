"use client";

import { useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

const items = [
  {
    title: "El trato que siempre quisiste ofrecer.",
    desc: "Cada cliente, recordado por su nombre, por su tratamiento y en su momento. La atención que distingue a un gran centro, sostenida en el tiempo y sin exigir un minuto más a tu equipo.",
    img: "/stock-1.jpg",
  },
  {
    title: "Una reputación a la altura de tu trabajo.",
    desc: "La satisfacción de tus clientes merece ser visible. Les invitamos a compartirla cuando la experiencia aún está reciente, y tu centro gana en Google el reconocimiento que ya tiene en cabina.*",
    img: "/stock-2.jpg",
  },
  {
    title: "Presencia, nunca insistencia.",
    desc: "Cada mensaje tiene un motivo y llega cuando corresponde. Tus clientes perciben cuidado, no publicidad, y eso es lo que les hace volver.",
    img: "/stock-3.jpg",
  },
];

export function CommitmentsScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)));
    setActive(i);
  });

  return (
    <div ref={ref} className="grid gap-10 md:grid-cols-2 md:gap-20">
      {/* Left: scrolling text */}
      <div>
        {items.map((it, i) => (
          <div
            key={it.title}
            className="flex min-h-[70vh] flex-col justify-center transition-opacity duration-500"
            style={{ opacity: active === i ? 1 : 0.25 }}
          >
            {/* image on mobile (no sticky panel there) */}
            <div className="mb-5 overflow-hidden rounded-2xl md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.img} alt={it.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            </div>
            <h3 className="mb-4 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {it.title}
            </h3>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>

      {/* Right: sticky image that crossfades with the active item */}
      <div className="hidden md:block">
        <div className="sticky top-[15vh] flex h-[70vh] items-center">
          <div className="relative h-[54vh] w-full overflow-hidden rounded-[28px] shadow-[0_40px_90px_-40px_rgba(67,48,43,0.5)]">
            {items.map((it, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={it.img}
                src={it.img}
                alt={it.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                style={{ opacity: active === i ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#43302b]/80 via-transparent to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-8 font-serif text-2xl font-semibold leading-tight text-white">
              {items[active].title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommitmentsScroll;
