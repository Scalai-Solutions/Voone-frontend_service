import { Palette, Layers, Gem } from "lucide-react";

const rows = [
  {
    icon: Palette,
    title: "Tu marca en cada detalle",
    desc: "Nombre, colores y tipografía: el pase se diseña con tu identidad, no con la nuestra.",
    highlight: true,
  },
  {
    icon: Layers,
    title: "Niveles a tu medida",
    desc: "Define tus categorías y las recompensas que las acompañan. De Bronze a Diamond, tú decides.",
    highlight: false,
  },
  {
    icon: Gem,
    title: "Un pase que da estatus",
    desc: "Elegante en el Wallet y hecho para presumir. Pertenecer se nota.",
    highlight: false,
  },
];

export function WhyVoone() {
  return (
    <section className="bg-rose/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/reserva-de-nuevo.png"
            alt="Aviso de la clínica en el móvil de una socia"
            className="w-full max-w-[380px] md:w-1/2 md:max-w-[440px] mx-auto object-contain drop-shadow-[0_30px_60px_rgba(67,48,43,0.35)]"
          />

          <div className="w-full md:w-1/2">
            <p className="text-gold uppercase tracking-[0.2em] text-sm font-semibold mb-4">Identidad propia</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-10">
              Un club tan único como tu clínica
            </h2>

            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.title}
                  className={`flex items-start gap-5 rounded-2xl p-5 transition-colors ${
                    r.highlight ? "bg-gold/10 border border-gold/30" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${r.highlight ? "bg-gold text-white" : "bg-secondary text-gold"}`}>
                    <r.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{r.title}</h3>
                    <p className="text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyVoone;
