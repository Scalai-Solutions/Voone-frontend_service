"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { WalletPass } from "@/components/ui/wallet-pass";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.04; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image:
          linear-gradient(to right, color-mix(in srgb, var(--color-gold) 10%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--color-gold) 10%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
      color: var(--color-foreground);
      text-shadow: 0 10px 30px rgba(67,48,43,0.12), 0 2px 4px rgba(67,48,43,0.08);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, var(--color-gold-light) 0%, var(--color-gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: drop-shadow(0px 6px 14px rgba(185,138,79,0.25));
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #f6e6cf 0%, var(--color-gold) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: drop-shadow(0px 12px 24px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
      background: linear-gradient(145deg, #2e1f1b 0%, #0d0806 100%);
      box-shadow:
          0 40px 100px -20px rgba(0, 0, 0, 0.6),
          0 20px 40px -20px rgba(58,39,35,0.5),
          inset 0 1px 2px rgba(217,180,119,0.18),
          inset 0 -2px 4px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(217,180,119,0.12);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(217,180,119,0.10) 0%, transparent 40%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(217,180,119,0.16) 0%, rgba(255,255,255,0.02) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow:
          0 0 0 1px rgba(217,180,119,0.18),
          0 25px 50px -12px rgba(0, 0, 0, 0.6),
          inset 0 1px 1px rgba(255,255,255,0.2);
  }

  .btn-wallet { transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1); }
  .btn-wallet-dark {
      background: linear-gradient(180deg, #2a1c18 0%, #100a08 100%);
      color: #fff;
      box-shadow: 0 0 0 1px rgba(217,180,119,0.2), 0 12px 24px -6px rgba(46,31,27,0.5), inset 0 1px 1px rgba(217,180,119,0.2);
  }
  .btn-wallet-dark:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(217,180,119,0.3), 0 18px 30px -6px rgba(46,31,27,0.6), inset 0 1px 1px rgba(217,180,119,0.25); }
  .btn-wallet-light {
      background: linear-gradient(180deg, #ffffff 0%, #f6ece2 100%);
      color: #43302b;
      box-shadow: 0 0 0 1px rgba(67,48,43,0.08), 0 12px 24px -6px rgba(67,48,43,0.2), inset 0 1px 1px #fff;
  }
  .btn-wallet-light:hover { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(67,48,43,0.12), 0 18px 30px -6px rgba(67,48,43,0.28), inset 0 1px 1px #fff; }
`;

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
}

export function CinematicHero({
  brandName = "VOONE",
  tagline1 = "Convierte tus clientes",
  tagline2 = "en socios",
  cardHeading = "El club digital de tu clínica.",
  cardDescription = (
    <>
      <span className="text-white font-semibold">Voone</span> lleva la
      membresía de tu clínica directamente a Apple Wallet y Google Wallet.
      Puntos, niveles y recompensas. Sin apps, sin fricción.
    </>
  ),
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, { rotationY: xVal * 10, rotationX: -yVal * 10, ease: "power3.out", duration: 1.2 });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge"], { autoAlpha: 0 });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.6, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.2, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=0.9");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: isMobile ? "+=500" : "+=800",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.15, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 200, z: -400, rotationX: 40, rotationY: -24, autoAlpha: 0, scale: 0.65 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.6")
        .fromTo(".card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 1.2 });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-screen h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased", className)}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* Hero texts */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <span aria-hidden="true" className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 font-serif font-black tracking-tighter leading-none text-foreground/[0.05] text-[30vw] whitespace-nowrap">
          VOONE
        </span>
        <h1 className="text-track gsap-reveal text-3d-matte font-serif text-5xl md:text-7xl lg:text-[6rem] font-semibold tracking-tight mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte font-serif text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight">
          {tagline2}
        </h1>
      </div>

      {/* The physical card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">
            {/* Brand name */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h2 className="font-serif text-6xl md:text-[6rem] lg:text-[7rem] font-bold tracking-tight text-card-silver-matte">
                {brandName}
              </h2>
            </div>

            {/* Real mockup */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              <div
                ref={mockupRef}
                className="relative will-change-transform scale-[0.62] md:scale-75 lg:scale-90"
                style={{ transformStyle: "preserve-3d" }}
              >
                <WalletPass scrollReveal />
              </div>

              <div className="floating-badge absolute flex top-6 lg:top-12 left-[-15px] lg:left-[-60px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                <span className="text-base lg:text-xl" aria-hidden="true">🏆</span>
                <div>
                  <p className="text-white text-xs lg:text-sm font-bold tracking-tight">Nivel Gold</p>
                  <p className="text-gold-light/70 text-[10px] lg:text-xs">Estatus desbloqueado</p>
                </div>
              </div>

              <div className="floating-badge absolute flex bottom-12 lg:bottom-20 right-[-15px] lg:right-[-60px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                <span className="text-base lg:text-lg" aria-hidden="true">🎁</span>
                <div>
                  <p className="text-white text-xs lg:text-sm font-bold tracking-tight">+250 puntos</p>
                  <p className="text-gold-light/70 text-[10px] lg:text-xs">Visita registrada</p>
                </div>
              </div>
            </div>

            {/* Accountability text */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
              <h3 className="font-serif text-white text-3xl md:text-4xl lg:text-5xl font-semibold mb-0 lg:mb-5 tracking-tight">
                {cardHeading}
              </h3>
              <p className="hidden md:block text-gold-light/70 text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
