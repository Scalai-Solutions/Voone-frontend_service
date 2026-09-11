"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Sparkles } from "lucide-react";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

type Cycle = "monthly" | "yearly";

interface Plan {
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  isFeatured: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: { monthly: 39, yearly: 390 },
    description: "Para dar tus primeros pasos en fidelización.",
    features: ["100 tarjetas activas", "8 notificaciones / mes", "Puntos y niveles", "Registro manual"],
    isFeatured: false,
  },
  {
    name: "Medium",
    price: { monthly: 59, yearly: 590 },
    description: "Para clínicas que quieren crecer en recurrencia.",
    features: ["150 tarjetas activas", "15 notificaciones / mes", "Todo lo de Starter", "Reseñas en Google", "Last minute"],
    isFeatured: true,
  },
  {
    name: "Pro",
    price: { monthly: 99, yearly: 990 },
    description: "Para varias sedes y equipos grandes.",
    features: ["300 tarjetas activas", "30 notificaciones / mes", "WhatsApp + bonus reseñas", "Analítica avanzada", "Soporte prioritario"],
    isFeatured: false,
  },
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12 + 0.15, duration: 0.6, ease: "easeInOut" as const },
  }),
};

export default function AuroraPricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <div className="relative w-full flex flex-col items-center justify-center px-6 py-24 md:py-32 overflow-hidden bg-rose/30 border-y border-border">
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="aurora-bg">
          <div className="aurora-shape-1" />
          <div className="aurora-shape-2" />
        </div>
      </div>
      <style>{`
        .aurora-bg { position: absolute; inset: 0; filter: blur(100px); }
        .aurora-shape-1, .aurora-shape-2 { position: absolute; border-radius: 50%; }
        .aurora-shape-1 { width: 600px; height: 600px; background-color: rgba(198,161,91,0.55); top: 6%; left: 8%; animation: moveAurora1 20s infinite alternate ease-in-out; }
        .aurora-shape-2 { width: 500px; height: 500px; background-color: rgba(232,211,154,0.45); bottom: 6%; right: 8%; animation: moveAurora2 25s infinite alternate ease-in-out; }
        @keyframes moveAurora1 { from { transform: translate(0,0) rotate(0deg); } to { transform: translate(100px,50px) rotate(180deg); } }
        @keyframes moveAurora2 { from { transform: translate(0,0) rotate(0deg); } to { transform: translate(-100px,-50px) rotate(-180deg); } }
        .card-aurora, .card-aurora-featured { background-size: 300% 300%; animation: gradient-animation 10s ease infinite; filter: blur(50px); }
        .card-aurora { background-image: linear-gradient(45deg, #b98a4f, #e8cf9a); }
        .card-aurora-featured { background-image: linear-gradient(45deg, #e8cf9a, #b98a4f); }
        @keyframes gradient-animation { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 mb-6"
        >
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-foreground/70">Precios claros, por sede</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeInOut" }}
          className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground"
        >
          Elige el plan de tu clínica
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <span className={cn("text-base", cycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>Mensual</span>
          <button
            aria-label="Cambiar ciclo de facturación"
            className="w-14 h-8 flex items-center bg-secondary rounded-full p-1 cursor-pointer"
            onClick={() => setCycle(cycle === "monthly" ? "yearly" : "monthly")}
          >
            <motion.div
              className="w-6 h-6 bg-gold rounded-full"
              layout
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
              style={{ marginLeft: cycle === "yearly" ? "auto" : "0" }}
            />
          </button>
          <span className={cn("text-base", cycle === "yearly" ? "text-foreground" : "text-muted-foreground")}>Anual</span>
          <span className="text-sm text-gold font-semibold">(2 meses gratis)</span>
        </motion.div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-7 max-w-6xl w-full">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            custom={index}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className={cn(
              "group relative p-8 rounded-3xl border overflow-hidden",
              plan.isFeatured ? "border-gold/60 bg-card shadow-[0_20px_50px_-25px_rgba(185,138,79,0.5)]" : "border-border bg-card"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500",
                plan.isFeatured ? "card-aurora-featured" : "card-aurora"
              )}
            />
            {plan.isFeatured && (
              <div className="absolute top-0 right-0 text-[11px] font-bold text-[#1a1204] bg-gold px-4 py-1.5 rounded-bl-lg tracking-wide">
                MÁS POPULAR
              </div>
            )}
            <div className="relative z-10 flex flex-col h-full text-left">
              <h3 className="font-serif text-2xl font-semibold text-foreground">{plan.name}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{plan.description}</p>

              <div className="flex items-baseline mt-8">
                <span className="text-5xl font-bold text-foreground tracking-tight">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={cycle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {plan.price[cycle]}€
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="text-muted-foreground ml-2">/{cycle === "monthly" ? "mes" : "año"} · sede</span>
              </div>

              <ul className="mt-8 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-muted-foreground text-sm">
                    <CheckCircle className="h-5 w-5 text-gold mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="https://calendly.com/business-voone/call"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "w-full mt-8 text-center text-base font-semibold rounded-xl py-3 transition-colors",
                  plan.isFeatured ? "bg-gold text-white hover:brightness-105" : "bg-secondary text-foreground hover:bg-secondary/70"
                )}
              >
                Empezar
              </a>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="relative z-10 text-center text-xs text-muted-foreground mt-10">Precios de referencia a validar comercialmente.</p>
    </div>
  );
}
