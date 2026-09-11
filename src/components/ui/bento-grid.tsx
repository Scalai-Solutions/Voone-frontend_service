"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 12 } },
};

interface BentoGridShowcaseProps {
  integrations: React.ReactNode;
  featureTags: React.ReactNode;
  mainFeature: React.ReactNode;
  secondaryFeature: React.ReactNode;
  statistic: React.ReactNode;
  journey: React.ReactNode;
  className?: string;
}

export const BentoGridShowcase = ({
  integrations,
  featureTags,
  mainFeature,
  secondaryFeature,
  statistic,
  journey,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn(
        "grid w-full grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-3 auto-rows-[minmax(200px,auto)]",
        className
      )}
    >
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">{integrations}</motion.div>
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-3">{mainFeature}</motion.div>
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">{featureTags}</motion.div>
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">{secondaryFeature}</motion.div>
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-2">{statistic}</motion.div>
      <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">{journey}</motion.div>
    </motion.section>
  );
};
