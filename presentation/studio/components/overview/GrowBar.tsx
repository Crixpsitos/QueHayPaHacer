"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/app/components/motion/primitives";

/** Relleno de barra: crece desde la izquierda al verse (transform, sin layout shift). */
export function GrowBar({
  pct,
  color,
  className,
  delay = 0,
}: {
  pct: number;
  color: string;
  className: string;
  delay?: number;
}) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={`${className} origin-left`}
      style={{ width: `${pct}%`, background: color }}
      initial={still ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
    />
  );
}
