"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/app/lib/utils/cn";

/**
 * Piezas de movimiento compartidas. Reglas de la casa:
 * - Solo transform/opacity; feedback de interacción ≤ 300 ms, entradas ≤ 500 ms.
 * - Todo respeta "reducir movimiento" (queda estático, sin perder contenido).
 * - El contenido llega completo en el HTML: lo que está sobre el pliegue no se oculta.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 26 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 140, damping: 18 } as const;

/** Aparece al entrar en pantalla (para contenido bajo el pliegue). */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Contenedor que escalona a sus `StaggerItem` al entrar en pantalla. */
export function Stagger({
  children,
  className,
  gap = 0.06,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  as?: "div" | "ul" | "ol";
}) {
  const still = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={still ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
      }}
    >
      {children}
    </Tag>
  );
}

/** Confirmación: el círculo y la palomita se dibujan. Úsalo tras una acción exitosa. */
export function SuccessCheck({ size = 56, className }: { size?: number; className?: string }) {
  const still = useReducedMotion();
  const draw = (delay: number, duration: number) =>
    still ? undefined : { pathLength: { duration, delay, ease: EASE_OUT }, opacity: { duration: 0.01, delay } };
  return (
    <motion.svg
      viewBox="0 0 52 52"
      width={size}
      height={size}
      role="img"
      aria-label="Listo"
      className={cn("text-emerald-600", className)}
      initial={still ? false : { scale: 0.85 }}
      animate={{ scale: 1 }}
      transition={SPRING_SNAPPY}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="23"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        initial={still ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={draw(0, 0.5)}
      />
      <motion.path
        d="M15 27.5l7.5 7.5L37.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={still ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={draw(0.35, 0.35)}
      />
    </motion.svg>
  );
}

/**
 * Llama la atención sobre UN botón clave: un anillo que late `times` veces al
 * verse en pantalla y se detiene (no es un bucle infinito que moleste).
 */
export function AttentionRing({
  children,
  active = true,
  times = 3,
  className,
  ringClassName = "rounded-xl border-[#D42F3C]",
}: {
  children: ReactNode;
  active?: boolean;
  times?: number;
  className?: string;
  ringClassName?: string;
}) {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <span ref={ref} className={cn("relative block", className)}>
      {active && !still && inView && (
        <motion.span
          aria-hidden="true"
          className={cn("pointer-events-none absolute inset-0 border-2", ringClassName)}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.08, opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut", repeat: times - 1, repeatDelay: 0.9, delay: 0.6 }}
        />
      )}
      {children}
    </span>
  );
}

/** Número que cuenta hasta `value` al verse; el HTML llega con el valor final. */
export function CountUp({
  value,
  format = (n: number) => new Intl.NumberFormat("es-CO").format(n),
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const still = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!inView || still) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setShown(Number.isInteger(value) ? Math.round(v) : v),
    });
    return () => controls.stop();
  }, [inView, still, value, duration]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className={className}>
        {format(shown)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
