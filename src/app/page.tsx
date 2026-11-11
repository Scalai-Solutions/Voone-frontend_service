import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { WhyVoone } from "@/components/ui/why-voone";
import SectionWithMockup from "@/components/ui/section-with-mockup";
import { ClubProgress } from "@/components/ui/club-progress";
import { Reveal } from "@/components/ui/reveal";
import FlowArt, { FlowSection } from "@/components/ui/story-scroll";
import { TimelineSteps } from "@/components/ui/timeline-steps";
import { CommitmentsScroll } from "@/components/ui/commitments-scroll";
import { DEMO_URL as CALENDLY, SITE_URL } from "@/lib/site";
import { landingSans, landingSerif } from "./landing-fonts";

const TITLE = "Voone · Fidelización para centros de estética";
const DESCRIPTION =
  "Voone convierte cada primera visita en una relación: una tarjeta de fidelización en Apple Wallet y Google Wallet, con tu marca, y la invitación a volver en el momento justo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "fidelización centros de estética",
    "tarjeta de fidelización",
    "Apple Wallet",
    "Google Wallet",
    "programa de puntos clínica estética",
    "Voone",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "Voone",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/voone-mark.jpg", width: 1024, height: 1024, alt: "Voone" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/voone-mark.jpg"] },
};

export const viewport: Viewport = { themeColor: "#faf2ee" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Voone",
      url: SITE_URL,
      logo: `${SITE_URL}/voone-mark.jpg`,
      description: DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Voone",
      inLanguage: "es-ES",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

// Design system — one set of tokens for every section.
const EYEBROW = "text-gold uppercase tracking-[0.2em] text-sm font-semibold mb-4";
const H2 = "font-serif text-4xl md:text-5xl font-semibold tracking-tight";

const centerSteps = [
  { t: "Un gesto por visita.", d: "Escanear la tarjeta y marcar el tratamiento.", img: "/step-recepcion.jpg" },
  { t: "Tu programa de reservas, intacto.", d: "Voone trabaja a su lado.", img: "/step-visita.jpg" },
  { t: "Cada cliente, reconocido al llegar.", d: "Su último tratamiento, a la vista antes de la cita.", img: "/step-referrals.jpg" },
  { t: "Tu centro, con claridad.", d: "Quién ha vuelto, quién lleva tiempo sin venir y qué ha funcionado.", img: "/step-dashboard.jpg" },
  { t: "Las campañas del año, preparadas.", d: "Las apruebas con un toque.", img: "/step-campanas.jpg" },
];

const faqs = [
  { q: "¿Para qué centros está pensado Voone?", a: "Para centros de estética y aparatología independientes, de uno a tres locales." },
  { q: "¿En qué se diferencia de la aplicación de mi programa de reservas?", a: "En esas aplicaciones tu cliente ve también otros centros. En Voone solo existe el tuyo." },
  { q: "Ya trabajo con bonos. ¿Es compatible?", a: "Sí. El bono asegura las sesiones ya pagadas. Voone se ocupa de las siguientes." },
  { q: "¿Con qué programas de reservas funciona?", a: "Con Flowww, Fresha, Zenoti y los principales del sector. Dinos el tuyo y lo confirmamos en la demostración." },
  { q: "¿Cuánto cuesta?", a: "Depende del tamaño de tu centro. Lo vemos en la demostración, con tus cifras." },
];

function WalletBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white text-sm font-medium border border-white/15">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
        Apple Wallet
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-neutral-800 text-sm font-medium border border-black/10">
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v1H3V8z" /><path fill="#34A853" d="M3 11h18v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5z" /><rect x="14" y="12.4" width="6" height="3.2" rx="1.6" fill="#FBBC05" /></svg>
        Google Wallet
      </span>
    </div>
  );
}

function CardProof() {
  return (
    <div className="flex items-center gap-4 pt-5 mt-5 border-t border-border/70">
      <div className="shrink-0 w-[72px] h-[72px] rounded-xl bg-white border border-border p-2 shadow-sm">
        <svg viewBox="0 0 29 29" className="w-full h-full" aria-hidden="true" fill="#43302b">
          <path d="M0 0h9v9H0V0zm2 2v5h5V2H2zM20 0h9v9h-9V0zm2 2v5h5V2h-5zM0 20h9v9H0v-9zm2 2v5h5v-5H2z" />
          <path d="M3.5 3.5h2v2h-2zM23.5 3.5h2v2h-2zM3.5 23.5h2v2h-2z" />
          <path d="M11 0h2v2h-2zM15 0h2v4h-2zM11 4h4v2h-4zM11 7h2v4h-2zM0 11h4v2H0zm6 0h3v2H6zm5 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h4v2h-4zM11 15h2v2h-2zm4 0h2v4h-2zm6 0h2v2h-2zm4 0h2v4h-2zM11 19h4v2h-4zm10 0h2v2h-2zM15 23h2v2h-2zm4 0h2v4h-2zm4 0h2v2h-2zm2 2h2v2h-2zM11 23h2v6h-2z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        <span className="font-semibold text-foreground">Llévatela.</span> Añade la tarjeta de demostración a tu móvil.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main
      className={`landing ${landingSans.variable} ${landingSerif.variable} overflow-x-clip w-full min-h-screen bg-background text-foreground`}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-4 pt-3">
        <div className="max-w-6xl mx-auto pl-4 pr-3 sm:pl-6 sm:pr-4 h-[72px] flex items-center justify-between rounded-[22px] bg-background/80 backdrop-blur-md border border-border/70 shadow-[0_12px_34px_-14px_rgba(67,48,43,0.3)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/voone-logo.png" alt="Voone" className="h-9 w-auto object-contain" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#tarjeta" className="hover:text-foreground transition-colors">La tarjeta</a>
            <a href="#club" className="hover:text-foreground transition-colors">El club</a>
            <a href="#compromisos" className="hover:text-foreground transition-colors">Compromisos</a>
            <a href="#preguntas" className="hover:text-foreground transition-colors">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full border border-border/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-white"
            >
              Iniciar sesión
            </Link>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gold text-white text-sm font-semibold px-5 py-2.5 hover:brightness-105 hover:-translate-y-0.5 transition whitespace-nowrap">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Solicitar demostración</span>
            </a>
          </div>
        </div>
      </header>

      {/* 1 · PORTADA — incluye el beat "El valor de un cliente que repite" */}
      <CinematicHero
        id="hero-root"
        cardHeading="Tu centro, en el móvil de cada cliente."
        cardDescription={
          <>
            <span className="text-white font-semibold">Voone</span> convierte cada primera visita en una
            relación. Un club que reconoce la fidelidad de tus clientes y les invita a volver cuando llega
            su momento.
          </>
        }
        ctaContent={
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className={EYEBROW}>El valor de un cliente que repite</p>
            <h2 className={`${H2} mb-8 text-foreground leading-[1.15]`}>
              Cuesta mucho ganar un cliente.
              <br />
              <span className="relative inline-block px-[0.12em]">
                <span className="cta-mark absolute inset-x-0 bottom-[0.1em] top-[0.14em] origin-left rounded-[3px] bg-gold/40" aria-hidden="true" />
                <span className="relative">Y muy poco perderlo.</span>
              </span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Un buen servicio no basta para que un cliente vuelva. Vuelve cuando se siente recordado y
              atendido de forma personal, también después de salir de tu centro. Ofrece a cada cliente esa
              atención, a su nombre y en su momento, sin que tu equipo tenga que estar pendiente.
            </p>
            <p className="font-serif text-2xl md:text-3xl text-gold mt-10">
              Una experiencia a la altura de tu trabajo en cabina.
            </p>
          </div>
        }
      />

      {/* 3-5 · transición apilada con rotación (La tarjeta -> El club -> El momento justo) */}
      <FlowArt>
        {/* 3 · LA TARJETA */}
        <FlowSection id="tarjeta" className="bg-rose text-foreground">
          <SectionWithMockup
            bare
            eyebrow="Tarjeta de fidelización en Apple Wallet y Google Wallet"
            title={<>Tu centro,<br />siempre con ellos.</>}
            description={
              <>
                Una tarjeta con tu nombre y tu imagen, guardada en el móvil de tu cliente junto a las que usa
                cada día. La añade en recepción, en segundos, sin apps y sin contraseñas. Diseñada con tu
                identidad: es tu marca la que llevan, no la nuestra.
              </>
            }
            primaryImageSrc="/mockup-pass.png"
            secondaryImageSrc="/mockup-alta.png"
            footer={
              <>
                <WalletBadges />
                <CardProof />
              </>
            }
          />
        </FlowSection>

        {/* 4 · EL CLUB */}
        <FlowSection id="club" className="bg-[#1c1712] text-white">
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className={EYEBROW}>Programa de puntos y niveles</p>
              <h2 className={`${H2} mb-6 text-white`}>
                Ser cliente tuyo tiene aún más valor.
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-md">
                Cada visita cuenta. Tus clientes suman experiencia, alcanzan niveles y acceden a ventajas que
                solo tu centro ofrece. El programa llega diseñado para tu centro de estética. Tú eliges los
                premios.
              </p>
              <p className="font-serif text-2xl text-gold-light max-w-md">
                Antes tenían una tarjeta de sellos. Ahora pertenecen a tu centro.
              </p>
            </div>
            {/* Progreso simulado de un cliente */}
            <div className="flex justify-center">
              <ClubProgress />
            </div>
          </div>
        </FlowSection>

        {/* 5 · EL MOMENTO JUSTO */}
        <FlowSection id="momento-justo" className="bg-rose text-foreground">
          <WhyVoone bare />
        </FlowSection>
      </FlowArt>

      {/* 6 · PARA TU CENTRO */}
      <section id="tu-centro" className="bg-gradient-to-b from-[#1c1712] to-[#0d0806] text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal className="max-w-2xl mb-16">
            <p className={EYEBROW}>Sin trabajo añadido para tu equipo</p>
            <h2 className={`${H2} text-white`}>
              Tu equipo no cambia nada. Tu agenda, sí.
            </h2>
          </Reveal>
          <TimelineSteps items={centerSteps} />
        </div>
      </section>

      {/* 7 · COMPROMISOS */}
      <section id="compromisos" className="bg-rose/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <Reveal className="max-w-2xl mb-14">
            <p className={EYEBROW}>Nuestros compromisos</p>
            <h2 className={`${H2} text-foreground`}>
              La confianza de tus clientes es tuya. Nosotros la protegemos.
            </h2>
          </Reveal>
          <CommitmentsScroll />
          <p className="mt-6 text-sm text-muted-foreground/70">
            Las opiniones son siempre voluntarias y nunca se recompensan.
          </p>
        </div>
      </section>

      {/* 8 · PREGUNTAS */}
      <section id="preguntas" className="bg-gradient-to-b from-[#0d0806] to-[#1c1712] text-white">
        <Reveal className="max-w-3xl mx-auto px-6 py-24 md:py-32">
          <h2 className={`${H2} text-center mb-14 text-white`}>Preguntas frecuentes</h2>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-lg text-white">
                  {f.q}
                  <span className="shrink-0 text-gold-light text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="text-white/60 leading-relaxed mt-3 pr-8">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 9 · CIERRE */}
      <div id="demo">
        <CinematicFooter />
      </div>
    </main>
  );
}
