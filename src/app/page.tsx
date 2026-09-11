import Image from "next/image";

import AuroraPricing from "@/components/ui/aurora-pricing";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import { CinematicFooter } from "@/components/ui/motion-footer";
import SectionWithMockup from "@/components/ui/section-with-mockup";
import TextMarquee from "@/components/ui/text-marquee";
import WhyVoone from "@/components/ui/why-voone";
import HowItWorks, { type Step } from "@/components/ui/how-it-works";

const steps: Step[] = [
  {
    title: "Alta por QR + NFC",
    description: "El cliente se une al club en segundos escaneando un QR o acercando el movil. Sin descargas.",
    colors: { bg: "#f8ece0", text: "#b98a4f", border: "#ead4be" },
    image: "/feat-experiencia.jpg",
  },
  {
    title: "Puntos y niveles",
    description: "Bronze, Silver, Gold, Platinum y Diamond. Cada visita acerca al siguiente hito.",
    colors: { bg: "#eef0ea", text: "#6f7b61", border: "#d8decf" },
    image: "/feat-puntos.jpg",
  },
  {
    title: "Hitos y recompensas",
    description: "Hasta 10 hitos configurables. Cada uno desbloquea una recompensa real de tu clinica.",
    colors: { bg: "#f3e4e0", text: "#b06a5a", border: "#e6cbc5" },
    image: "/feat-rewards.jpg",
  },
  {
    title: "Last minute",
    description: "Convierte huecos libres y cancelaciones en reservas para los miembros adecuados.",
    colors: { bg: "#efe7dc", text: "#8a5b48", border: "#dacabb" },
    image: "/feat-lastminute.jpg",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="fixed left-0 right-0 top-0 z-50 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-border/70 bg-background/72 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(67,48,43,0.55)] backdrop-blur-xl">
          <Image src="/voone-logo.png" alt="Voone" width={118} height={32} className="h-7 w-auto" priority />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#producto" className="transition-colors hover:text-foreground">Producto</a>
            <a href="#club" className="transition-colors hover:text-foreground">Club</a>
            <a href="#precios" className="transition-colors hover:text-foreground">Precios</a>
          </nav>
          <a
            href="https://calendly.com/business-voone/call"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#2a1c18] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(46,31,27,0.55)] transition-transform hover:-translate-y-0.5"
          >
            Solicitar demo
          </a>
        </div>
      </header>

      <CinematicHero />

      <section id="producto">
        <SectionWithMockup
          title={(
            <>
              Tu club,
              <br /> dentro del Wallet
            </>
          )}
          description="El cliente escanea un QR o acerca su movil, anade su Membership Pass a Apple o Google Wallet y empieza a acumular. Sin descargar nada. Puntos, nivel y proxima recompensa, siempre a mano."
          primaryImageSrc="/mockup-principal.png"
          secondaryImageSrc="/mockup-pass.png"
          footer={(
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-foreground">Apple Wallet</span>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-foreground">Google Wallet</span>
            </div>
          )}
        />
      </section>

      <div className="border-y border-border bg-background py-5">
        <TextMarquee clasname="font-serif text-5xl font-semibold text-foreground/80 md:text-7xl" baseVelocity={-3} scrollDependent>
          Compatible con tu software * Flowww * Fresha * Zenoti * Apple Wallet * Google Wallet *
        </TextMarquee>
      </div>

      <section id="club" className="bg-background px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">Convierte clientes en socios</p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-6xl">Un club digital, no otro software</h2>
        </div>
        <HowItWorks features={steps} />
      </section>

      <WhyVoone />

      <section id="precios">
        <AuroraPricing />
      </section>

      <CinematicFooter />
    </main>
  );
}
