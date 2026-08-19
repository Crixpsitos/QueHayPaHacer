"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionFadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function MotionFadeIn({ children, className, delay = 0 }: MotionFadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
