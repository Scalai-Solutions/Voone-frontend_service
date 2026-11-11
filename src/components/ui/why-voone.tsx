import { Reveal } from "@/components/ui/reveal";
import { PhoneMessages } from "@/components/ui/phone-messages";

export function WhyVoone({ bare = false }: { bare?: boolean }) {
  const content = (
    <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
      <div className="flex w-full justify-center md:w-1/2 shrink-0">
        <PhoneMessages />
      </div>

      <div className="w-full md:w-1/2">
        <p className="text-gold uppercase tracking-[0.2em] text-sm font-semibold mb-4">
          Avisos automáticos según cada tratamiento
        </p>
        <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
          Deja de hacer promociones genéricas. Cada tratamiento tiene su momento, y Voone lo sabe.
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-5">
          Antes de que llegue la hora de volver, tu cliente ya recibe un mensaje de tu centro.
          Le ofrecemos un nuevo tratamiento y una oferta personalizada.
        </p>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Más visitas y más tratamientos por cliente, y un ticket más alto gracias a la venta cruzada.
        </p>
      </div>
    </div>
  );

  if (bare) return <div className="max-w-6xl mx-auto w-full">{content}</div>;

  return (
    <section id="momento-justo" className="bg-rose/30 border-y border-border">
      <Reveal className="max-w-6xl mx-auto px-6 py-24 md:py-32">{content}</Reveal>
    </section>
  );
}

export default WhyVoone;
