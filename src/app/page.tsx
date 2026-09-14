import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import {
  ScrollXCarousel,
  ScrollXCarouselContainer,
  ScrollXCarouselProgress,
  ScrollXCarouselWrap,
} from "@/components/ui/scroll-x-carousel";
import { CardHoverReveal, CardHoverRevealMain } from "@/components/ui/reveal-on-hover";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { WhyVoone } from "@/components/ui/why-voone";
import HowItWorks, { type Step } from "@/components/ui/how-it-works";
import SectionWithMockup from "@/components/ui/section-with-mockup";
import { WalletCard, WALLET_THEMES } from "@/components/ui/wallet-card";
import AuroraPricing from "@/components/ui/aurora-pricing";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TextMarquee from "@/components/ui/text-marquee";
import { Star } from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "+18.000", label: "Miembros activos" },
  { value: "85%", label: "Tasa de retención" },
  { value: "3,4x", label: "Más reservas recurrentes" },
  { value: "+42%", label: "Más reseñas en Google" },
  { value: "+31%", label: "Satisfacción del cliente habitual" },
  { value: "1 día", label: "Puesta en marcha" },
];

const carouselSlides = [
  { tag: "Onboarding", title: "Alta por QR + NFC", desc: "El cliente se une al club en segundos escaneando un QR o acercando el móvil. Sin descargas.", img: "/mockup-alta.png" },
  { tag: "Fidelización", title: "Puntos y niveles", desc: "Bronze, Silver, Gold, Platinum y Diamond. Cada visita acerca al siguiente hito.", img: "/lb-puntos.jpg" },
  { tag: "Recompensas", title: "Hitos y recompensas", desc: "Hasta 10 hitos configurables. Cada uno desbloquea una recompensa real de tu clínica.", img: "/lb-milestones.jpg" },
  { tag: "Ocupación", title: "Last minute", desc: "Convierte huecos libres y cancelaciones en reservas para los miembros adecuados.", img: "/lb-lastminute.jpg" },
  { tag: "Crecimiento", title: "Recomendaciones", desc: "Cada miembro tiene su código. Recomienda amigos y gana puntos con su primera compra.", img: "/lb-referrals.jpg" },
];

const steps: Step[] = [
  { title: "Se une en recepción", description: "Escanea el QR o acerca el móvil. En segundos tiene su pase, sin rellenar formularios eternos.", colors: { bg: "#efdcd5", text: "#b98a4f", border: "rgba(185,138,79,0.25)" }, image: "/feat-experiencia.jpg" },
  { title: "Registráis cada visita", description: "Tu equipo escanea el pase al cobrar. Los puntos y el nivel se actualizan sin apuntar nada a mano.", colors: { bg: "#f4e7d8", text: "#a9793f", border: "rgba(169,121,63,0.25)" }, image: "/feat-puntos.jpg" },
  { title: "Desbloquea premios", description: "Al llegar a cada hito recibe un aviso y un premio real. El progreso engancha y motiva a volver.", colors: { bg: "#f0e2db", text: "#8a5b48", border: "rgba(138,91,72,0.25)" }, image: "/feat-rewards.jpg" },
  { title: "Reserva de nuevo", description: "Le recuerdas justo cuando toca y le ofreces el hueco perfecto. La agenda no se enfría.", colors: { bg: "#efdcd5", text: "#b98a4f", border: "rgba(185,138,79,0.25)" }, image: "/feat-lastminute.jpg" },
];

const testimonials = [
  { name: "Marta Alcázar", clinic: "Clínica Aurea, Madrid", quote: "Nuestros clientes vuelven más. El pase en el Wallet ha subido la recurrencia sin que tengamos que perseguir a nadie.", initials: "MA" },
  { name: "Carlos Guerra", clinic: "Estética Nova, Valencia", quote: "Lo montamos en un día. Recepción solo escanea y registra. Los huecos de last minute se llenan solos.", initials: "CG" },
  { name: "Lucía Romero", clinic: "Med Skin, Sevilla", quote: "Por fin un programa de fidelización que se siente premium y no como otro software más para gestionar.", initials: "LR" },
];

export default function Home() {
  return (
    <main className="w-full min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 px-3 pt-3 sm:px-4">
        <div className="max-w-6xl mx-auto flex h-[72px] items-center justify-between rounded-[22px] border border-border/70 bg-background/80 pl-4 pr-3 shadow-[0_12px_34px_-14px_rgba(67,48,43,0.3)] backdrop-blur-md sm:pl-6 sm:pr-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/voone-logo.png" alt="Voone" className="h-14 w-auto object-contain" />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#producto" className="transition-colors hover:text-foreground">Producto</a>
            <a href="#como-funciona" className="transition-colors hover:text-foreground">Cómo funciona</a>
            <a href="#precios" className="transition-colors hover:text-foreground">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="whitespace-nowrap rounded-full border border-border/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-white">
              Login
            </Link>
            <a
              href="https://calendly.com/business-voone/call"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      <CinematicHero />

      <section className="relative z-10 space-y-4 overflow-hidden border-b border-border bg-rose/40 py-12">
        {[stats.slice(0, 3), stats.slice(3)].map((row, index) => (
          <TextMarquee key={index} baseVelocity={index === 0 ? -2.2 : 2.2} clasname="text-base">
            <span className="flex items-center gap-10">
              {row.map((stat) => (
                <span key={stat.label} className="flex items-baseline gap-3 whitespace-nowrap">
                  <span className="font-serif text-3xl font-bold text-gold md:text-4xl">{stat.value}</span>
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  <span className="ml-4 text-2xl text-gold/30">*</span>
                </span>
              ))}
            </span>
          </TextMarquee>
        ))}
      </section>

      <div id="producto">
        <SectionWithMockup
          title={(
            <>
              Tu club,
              <br />dentro del Wallet
            </>
          )}
          description="El cliente escanea un QR o acerca su móvil, añade su Membership Pass a Apple o Google Wallet y empieza a acumular. Sin descargar nada. Puntos, nivel y próxima recompensa, siempre a mano, en el móvil que ya lleva encima."
          primaryImageSrc="/mockup-pass.png"
          secondaryImageSrc="/mockup-alta.png"
          footer={(
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black px-4 py-2 text-sm font-medium text-white">Apple Wallet</span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800">Google Wallet</span>
            </div>
          )}
        />
      </div>

      <section className="overflow-hidden border-b border-border bg-rose/40 py-7">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((key) => (
            <span key={key} className="flex items-center whitespace-nowrap font-serif text-2xl tracking-tight text-gold/70 md:text-3xl">
              {["Compatible con tu software", "Flowww", "Fresha", "Zenoti", "Apple Wallet", "Google Wallet"].map((word) => (
                <span key={word} className="mx-8 flex items-center gap-8">{word}<span className="text-gold/30">*</span></span>
              ))}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#1c1712]">
        <ScrollXCarousel>
          <ScrollXCarouselContainer className="flex flex-col justify-center gap-7">
            <div className="mx-auto w-full max-w-6xl px-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-light">Convierte clientes en socios</p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white md:text-5xl">Un club digital, no otro software</h2>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-[0_auto_0_0] z-10 h-full w-[10vw] bg-[linear-gradient(90deg,_#1c1712_25%,_transparent)]" />
              <div className="pointer-events-none absolute inset-[0_0_0_auto] z-10 h-full w-[10vw] bg-[linear-gradient(270deg,_#1c1712_25%,_transparent)]" />

              <ScrollXCarouselWrap className="flex space-x-6 [&>*:first-child]:ml-6 [&>*:last-child]:mr-6 md:[&>*:first-child]:ml-[6vw] md:[&>*:last-child]:mr-[6vw]">
                {carouselSlides.map((slide) => (
                  <CardHoverReveal
                    key={slide.title}
                    className="group h-[72vh] max-h-[720px] min-w-[72vw] rounded-3xl border border-border bg-[#f3e7db] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] sm:min-w-[50vw] md:min-w-[38vw] xl:min-w-[30vw]"
                  >
                    <CardHoverRevealMain>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={slide.title} src={slide.img} className="size-full object-contain object-top p-3" />
                    </CardHoverRevealMain>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-[#241713] via-[#241713]/85 to-transparent p-8">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">{slide.tag}</span>
                      <h3 className="mb-2 mt-2 font-serif text-2xl font-semibold text-white md:text-3xl">{slide.title}</h3>
                      <p className="max-w-md text-sm leading-relaxed text-white/75 md:text-[15px]">{slide.desc}</p>
                    </div>
                  </CardHoverReveal>
                ))}
              </ScrollXCarouselWrap>
            </div>

            <ScrollXCarouselProgress
              className="mx-6 h-1 overflow-hidden rounded-full bg-white/15 md:mx-[6vw]"
              progressStyle="size-full bg-gold rounded-full"
            />
          </ScrollXCarouselContainer>
        </ScrollXCarousel>
      </section>

      <WhyVoone />

      <section className="overflow-hidden bg-gradient-to-b from-[#0d0806] to-[#1c1712] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">La experiencia del socio</p>
            <h2 className="mb-6 font-serif text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Su tarjeta,
              <br />su estatus
            </h2>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-white/60">
              El socio abre su pase y ve al instante su nivel, sus puntos y lo que le falta para el próximo premio. Ese pequeño gesto, visita tras visita, es lo que le trae de vuelta a tu clínica y no a la de al lado.
            </p>
            <a href="https://calendly.com/business-voone/call" target="_blank" rel="noopener noreferrer" className="inline-block rounded-2xl bg-gold px-8 py-3.5 font-bold text-white transition hover:brightness-105">
              Ver una demo
            </a>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="relative h-[500px] w-[300px]">
              <div className="absolute left-0 top-0 z-10 rotate-[-8deg]">
                <WalletCard
                  theme={WALLET_THEMES.gold}
                  data={{ clinic: "AURÉA", clinicSub: "CLINIC CLUB", member: "Verónica Navarro", tierLabel: "GOLD MEMBER", tier: "Gold", points: "1.250", balance: "€240", reward: "Hydrafacial a 250 pts - te faltan 2 visitas", progress: 83, since: "2026" }}
                />
              </div>
              <div className="absolute left-[52px] top-[150px] z-20 rotate-[6deg]">
                <WalletCard
                  theme={WALLET_THEMES.diamond}
                  data={{ clinic: "LUMIÈRE", clinicSub: "MEDICAL BEAUTY", member: "Álvaro Ferrer", tierLabel: "DIAMOND", tier: "Diamond", points: "4.980", balance: "€620", reward: "Sesión láser a 5.000 pts - te faltan 20 pts", progress: 96, since: "2025" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-border bg-rose/30">
        <div className="mx-auto max-w-6xl px-6 pt-24 md:pt-28">
          <h2 className="mb-4 text-center font-serif text-4xl font-bold tracking-tight md:text-5xl">Cómo funciona</h2>
          <p className="mx-auto mb-4 max-w-xl text-center text-muted-foreground">
            De la primera visita a socio recurrente en cuatro pasos.
          </p>
          <HowItWorks features={steps} />
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#1c1712] to-[#0d0806] text-white">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <h2 className="mb-14 text-center font-serif text-4xl font-bold tracking-tight text-white md:text-5xl">Clínicas que ya fidelizan con Voone</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-transform hover:-translate-y-1">
                <div className="mb-4 flex gap-1 text-gold-light">
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-gold-light" />)}
                </div>
                <p className="mb-6 leading-relaxed text-white/90">“{testimonial.quote}”</p>
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback className="bg-white/10 text-xs font-semibold text-gold-light">{testimonial.initials}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/50">{testimonial.clinic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios">
        <AuroraPricing />
      </section>

      <div id="demo">
        <CinematicFooter />
      </div>
    </main>
  );
}
