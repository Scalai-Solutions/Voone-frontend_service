"use client";

import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";

interface CardProps {
  number: string;
  title: string;
  description: string;
  className?: string;
  rotate?: string;
  colors: { bg: string; text: string; border: string };
  image?: string;
  imageSide?: "left" | "right";
  index?: number;
}

const Pin = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

const Card = ({ number, title, description, className, rotate, colors, image, imageSide = "right", index = 0 }: CardProps) => (
  <m.div
    className={`group relative w-full md:w-[280px] transition-transform duration-300 hover:z-30 hover:scale-105 ${rotate} ${className}`}
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.7, delay: (index % 4) * 0.12, ease: "easeOut" }}
  >
    {image && (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className={`hidden md:block absolute top-10 z-0 w-[190px] h-[240px] object-cover rounded-[22px] shadow-[0_20px_40px_-15px_rgba(67,48,43,0.35)] transition-transform duration-500 group-hover:scale-105 ${
          imageSide === "right" ? "-right-32 rotate-6" : "-left-32 -rotate-6"
        }`}
      />
    )}
    <div className="relative z-10 bg-white p-2 rounded-[25px] shadow-[0px_10px_30px_0px_rgba(67,48,43,0.12)] border border-border">
      <Pin className={`w-8 h-8 z-20 mb-6 mx-auto`} style={{ color: colors.text }} />
      <div className="rounded-[15px] p-[15px] h-full flex flex-col relative overflow-hidden border" style={{ background: colors.bg, borderColor: colors.border }}>
        <span className="font-serif text-4xl mb-5" style={{ color: colors.text }}>{number}</span>
        <h3 className="text-2xl font-semibold text-foreground leading-none mb-[10px]">{title}</h3>
        <p className="text-muted-foreground text-sm/5 tracking-tight">{description}</p>
      </div>
    </div>
  </m.div>
);

export interface Step {
  title: string;
  description: string;
  colors: { bg: string; text: string; border: string };
  image?: string;
}

const DEFAULT_POSITIONS = [
  { className: "md:absolute md:top-0 md:left-[15%]", rotate: "rotate-6" },
  { className: "md:absolute md:top-[120px] md:right-[15%]", rotate: "-rotate-6" },
  { className: "md:absolute md:top-[450px] md:left-[15%]", rotate: "rotate-6" },
  { className: "md:absolute md:top-[570px] md:right-[10%]", rotate: "-rotate-6" },
];

export default function HowItWorks({ features, className }: { features: Step[]; className?: string }) {
  const data = features;
  const positions = DEFAULT_POSITIONS;
  const height = data.length <= 3 ? 800 : 900;

  return (
    <LazyMotion features={domAnimation}>
      <div className={`relative px-8 max-md:pt-10 max-md:pb-16 md:py-20 ${className || ""}`}>
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            className="relative w-full max-w-[1000px] mx-auto flex flex-col space-y-8 md:space-y-0 md:block h-auto md:h-[var(--md-height)]"
            style={{ "--md-height": `${height}px` } as React.CSSProperties}
          >
            {data.length > 1 && (
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block z-0" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none">
                {(() => {
                  const pathD = data.reduce((acc, _, index) => {
                    if (index >= data.length - 1) return acc;
                    if (index === 0) return "M 290 150 C 500 150, 550 270, 710 270";
                    if (index === 1) return acc + " C 850 270, 500 350, 290 450";
                    if (index === 2) return acc + " C 290 600, 550 720, 750 720";
                    return acc;
                  }, "");
                  return (
                    <m.path
                      d={pathD}
                      stroke="var(--color-gold)"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      fill="none"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: -140 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  );
                })()}
              </svg>
            )}

            {data.map((step, index) => {
              const position = positions[index % positions.length];
              return (
                <Card
                  key={step.title}
                  number={`0${index + 1}`}
                  title={step.title}
                  description={step.description}
                  colors={step.colors}
                  rotate={position.rotate}
                  className={position.className}
                  image={step.image}
                  imageSide={index % 2 === 0 ? "left" : "right"}
                  index={index}
                />
              );
            })}
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
