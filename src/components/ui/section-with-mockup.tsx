"use client";

import React from "react";
import { motion } from "motion/react";

interface SectionWithMockupProps {
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  primaryImageSrc: string;
  secondaryImageSrc: string;
  reverseLayout?: boolean;
  footer?: React.ReactNode;
}

const SectionWithMockup: React.FC<SectionWithMockupProps> = ({
  title,
  description,
  primaryImageSrc,
  secondaryImageSrc,
  reverseLayout = false,
  footer,
}) => {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
  };

  const layoutClasses = reverseLayout ? "md:grid-cols-2 md:grid-flow-col-dense" : "md:grid-cols-2";
  const textOrderClass = reverseLayout ? "md:col-start-2" : "";
  const imageOrderClass = reverseLayout ? "md:col-start-1" : "";

  return (
    <section className="relative py-24 md:py-40 bg-rose/30 border-y border-border overflow-hidden">
      <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-10 mx-auto">
        <motion.div
          className={`grid grid-cols-1 gap-16 md:gap-24 w-full items-center ${layoutClasses}`}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className={`flex flex-col items-start gap-5 mt-10 md:mt-0 max-w-[546px] mx-auto md:mx-0 ${textOrderClass}`}
            variants={itemVariants}
          >
            <p className="text-gold uppercase tracking-[0.2em] text-sm font-semibold">El producto</p>
            <h2 className="font-serif text-foreground text-3xl md:text-[42px] font-semibold leading-tight md:leading-[1.15]">
              {title}
            </h2>
            <p className="text-muted-foreground text-base md:text-[16px] leading-7">{description}</p>
            {footer && <div className="pt-2">{footer}</div>}
          </motion.div>

          <motion.div
            className={`relative mt-10 md:mt-0 mx-auto ${imageOrderClass} w-full max-w-[300px] md:max-w-[471px]`}
            variants={itemVariants}
          >
            {/* Decorative secondary image behind */}
            <motion.div
              className="absolute w-[280px] h-[300px] md:w-[440px] md:h-[480px] rounded-[32px] z-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              style={{
                top: reverseLayout ? "auto" : "8%",
                bottom: reverseLayout ? "8%" : "auto",
                left: reverseLayout ? "auto" : "-18%",
                right: reverseLayout ? "-18%" : "auto",
                backgroundImage: `url(${secondaryImageSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(1px)",
              }}
              initial={{ y: 0 }}
              whileInView={{ y: reverseLayout ? -24 : -28 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.5 }}
            />
            {/* Main mockup — transparent phone, floating */}
            <motion.div
              className="relative z-10 flex justify-center"
              initial={{ y: 0 }}
              whileInView={{ y: reverseLayout ? 20 : 28 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true, amount: 0.5 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImageSrc}
                alt="Membership Pass de Voone en el Wallet"
                className="w-full h-auto max-h-[405px] md:max-h-[640px] object-contain drop-shadow-[0_50px_100px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <div
        className="absolute w-full h-px bottom-0 left-0 z-0"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(217,180,119,0.3) 0%, rgba(255,255,255,0) 100%)" }}
      />
    </section>
  );
};

export default SectionWithMockup;
