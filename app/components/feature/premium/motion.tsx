"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { formatCOP } from "@/presentation/profile/lib/membership";

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Burbujas ──────────────────────────────────────────────────────────────────
// Capa decorativa: cada burbuja tiene tres niveles de movimiento (parallax con
// el puntero y el scroll → entrada con resorte → flotación infinita). Solo
// transform/opacity. Con "reducir movimiento" quedan quietas; en táctil no hay
// parallax de puntero.

type Tone = "crimson" | "gold" | "rose" | "ink";
interface OrbSpec {
  size: number;
  left: string;
  top: string;
  tone: Tone;
  /** 0–2: cuánto se mueve con el parallax (más cerca = más grande). */
  depth: number;
  /** px de flotación vertical. */
  drift: number;
  dur: number;
  desktopOnly?: boolean;
}

const TONES: Record<Tone, { fill: string; edge: string }> = {
  crimson: { fill: "rgba(230,57,70,.20)", edge: "rgba(230,57,70,.5)" },
  gold: { fill: "rgba(255,183,3,.28)", edge: "rgba(255,183,3,.65)" },
  rose: { fill: "rgba(230,57,70,.07)", edge: "rgba(230,57,70,.18)" },
  ink: { fill: "#09090B", edge: "#09090B" },
};

const ORBS = {
  hero: [
    { size: 340, left: "76%", top: "-14%", tone: "gold", depth: 0.3, drift: 16, dur: 13 },
    { size: 220, left: "-6%", top: "38%", tone: "crimson", depth: 0.5, drift: 18, dur: 10 },
    { size: 180, left: "63%", top: "42%", tone: "rose", depth: 0.7, drift: 20, dur: 11 },
    { size: 120, left: "44%", top: "4%", tone: "gold", depth: 1, drift: 22, dur: 8 },
    { size: 64, left: "53%", top: "74%", tone: "crimson", depth: 1.4, drift: 14, dur: 7 },
    { size: 36, left: "23%", top: "3%", tone: "gold", depth: 1.7, drift: 12, dur: 6, desktopOnly: true },
    { size: 28, left: "93%", top: "42%", tone: "crimson", depth: 1.3, drift: 12, dur: 6.5, desktopOnly: true },
    { size: 14, left: "8%", top: "22%", tone: "ink", depth: 1.9, drift: 10, dur: 5.5, desktopOnly: true },
    { size: 10, left: "55%", top: "42%", tone: "ink", depth: 2, drift: 8, dur: 5, desktopOnly: true },
  ],
  banner: [
    { size: 150, left: "74%", top: "-45%", tone: "rose", depth: 0.6, drift: 10, dur: 9 },
    { size: 80, left: "58%", top: "-24%", tone: "gold", depth: 1, drift: 12, dur: 7 },
    { size: 52, left: "81%", top: "66%", tone: "crimson", depth: 1.2, drift: 10, dur: 6 },
    { size: 24, left: "62%", top: "76%", tone: "gold", depth: 1.5, drift: 8, dur: 5.5, desktopOnly: true },
  ],
  cta: [
    { size: 260, left: "82%", top: "4%", tone: "rose", depth: 0.4, drift: 14, dur: 12 },
    { size: 90, left: "85%", top: "50%", tone: "gold", depth: 1, drift: 16, dur: 8 },
    { size: 48, left: "94%", top: "72%", tone: "crimson", depth: 1.4, drift: 12, dur: 6.5, desktopOnly: true },
    { size: 16, left: "79%", top: "32%", tone: "ink", depth: 1.8, drift: 8, dur: 5, desktopOnly: true },
  ],
} satisfies Record<string, OrbSpec[]>;

function bubbleStyle(tone: Tone) {
  const { fill, edge } = TONES[tone];
  if (tone === "ink") return { background: fill };
  return {
    // Brillo arriba a la izquierda + borde más intenso = burbuja de jabón.
    background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0, rgba(255,255,255,0) 20%), radial-gradient(circle at 50% 50%, transparent 58%, ${edge} 100%), ${fill}`,
    boxShadow: `inset 0 0 0 1px ${edge}`,
  };
}

function Orb({
  spec,
  index,
  mx,
  my,
  scroll,
  still,
}: {
  spec: OrbSpec;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scroll: MotionValue<number>;
  still: boolean;
}) {
  const x = useTransform(mx, (v) => v * spec.depth * 70);
  const y = useTransform([my, scroll], ([py, sp]: number[]) => py * spec.depth * 50 - sp * spec.depth * 140);
  const base = {
    position: "absolute" as const,
    left: spec.left,
    top: spec.top,
    width: spec.size,
    height: spec.size,
  };
  const look = { ...bubbleStyle(spec.tone), borderRadius: "9999px", width: "100%", height: "100%" };
  const cls = spec.desktopOnly ? "hidden md:block" : undefined;

  if (still) {
    return (
      <div className={cls} style={base}>
        <div style={look} />
      </div>
    );
  }
  return (
    <motion.div className={cls} style={{ ...base, x, y }}>
      <motion.div
        className="size-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 + index * 0.08 }}
      >
        <motion.div
          style={look}
          animate={{ y: [0, -spec.drift, 0], x: [0, spec.drift * 0.4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: spec.dur, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        />
      </motion.div>
    </motion.div>
  );
}

/** Capa de burbujas. El contenedor padre debe ser `relative isolate overflow-hidden`. */
export function Orbs({ variant = "hero", interactive = true }: { variant?: keyof typeof ORBS; interactive?: boolean }) {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useSpring(0, { stiffness: 60, damping: 20, mass: 0.8 });
  const my = useSpring(0, { stiffness: 60, damping: 20, mass: 0.8 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  useEffect(() => {
    if (still || !interactive || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: globalThis.PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [still, interactive, mx, my]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {ORBS[variant].map((spec, i) => (
        <Orb key={i} spec={spec} index={i} mx={mx} my={my} scroll={scrollYProgress} still={still} />
      ))}
    </div>
  );
}

// ── Boleta con inclinación 3D ─────────────────────────────────────────────────
// La entrada solo mueve (no oculta): el contenido llega visible en el HTML.

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const still = !!useReducedMotion();
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className={className}
      style={still ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={still ? false : { y: 36, rotate: 3 }}
      animate={{ y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.1 }}
      onPointerMove={still ? undefined : onMove}
      onPointerLeave={still ? undefined : reset}
    >
      {children}
    </motion.div>
  );
}

// ── Precio que cuenta ─────────────────────────────────────────────────────────

export function CopCountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const still = useReducedMotion();
  const [shown, setShown] = useState(value); // el HTML llega con el precio final

  useEffect(() => {
    if (!inView || still) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v / 500) * 500),
    });
    return () => controls.stop();
  }, [inView, still, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {formatCOP(shown)}
      </span>
      <span className="sr-only">{formatCOP(value)}</span>
    </>
  );
}

// ── Revelado al hacer scroll ──────────────────────────────────────────────────

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={still ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Tarjeta de característica: la burbuja del icono se llena al pasar el puntero. */
export function FeatureItem({ icon, title, body, index }: { icon: ReactNode; title: string; body: string; index: number }) {
  const still = useReducedMotion();
  return (
    <motion.li
      className="group border-t border-[#E4E4E7] pt-5"
      initial={still ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover="hover"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.5, ease: EASE, delay: (index % 3) * 0.08 }}
    >
      <motion.span
        variants={{ hover: { scale: 1.12, rotate: -6 } }}
        transition={{ type: "spring", stiffness: 350, damping: 16 }}
        className="flex size-11 items-center justify-center rounded-full bg-[#FDF2F4] text-[#D42F3C] transition-colors duration-200 group-hover:bg-[#D42F3C] group-hover:text-white"
      >
        {icon}
      </motion.span>
      <p className="mt-4 font-semibold text-[#09090B]">{title}</p>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[#52525B]">{body}</p>
    </motion.li>
  );
}

// ── Tabla Básico / Premium ────────────────────────────────────────────────────

export function ComparisonTable({ rows, priceCop }: { rows: [string, boolean, boolean][]; priceCop: number }) {
  const still = useReducedMotion();
  return (
    <table className="mt-6 w-full text-left text-[15px]">
      <thead>
        <tr className="border-b border-[#E4E4E7] text-sm text-[#71717A]">
          <th className="py-3 font-medium">Herramienta</th>
          <th className="w-24 py-3 text-center font-medium">Básico</th>
          <th className="w-28 py-3 text-center font-medium text-[#09090B]">Premium</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, basic, premium], i) => (
          <motion.tr
            key={label}
            className="border-b border-[#F4F4F5]"
            initial={still ? false : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -40px 0px" }}
            transition={{ duration: 0.4, ease: EASE, delay: i * 0.04 }}
          >
            <td className="py-3 text-[#3F3F46]">{label}</td>
            {[basic, premium].map((on, c) => (
              <td key={c} className="py-3 text-center">
                {on ? (
                  <motion.span
                    className="mx-auto inline-flex"
                    initial={still ? false : { scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.15 + i * 0.04 + c * 0.06 }}
                  >
                    <Check className={c === 1 ? "size-4 text-[#D42F3C]" : "size-4 text-[#09090B]"} aria-label="Incluido" />
                  </motion.span>
                ) : (
                  <Minus className="mx-auto size-4 text-[#D4D4D8]" aria-label="No incluido" />
                )}
              </td>
            ))}
          </motion.tr>
        ))}
        <tr>
          <td className="py-3 font-medium text-[#09090B]">Precio</td>
          <td className="py-3 text-center text-[#3F3F46]">Gratis</td>
          <td className="whitespace-nowrap py-3 text-center font-medium text-[#09090B]">{formatCOP(priceCop)}/mes</td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Pasos: la línea se dibuja y los números aparecen en secuencia ─────────────

export function StepsTimeline({ steps }: { steps: { title: string; body: string }[] }) {
  const still = useReducedMotion();
  return (
    <ol className="relative mt-6 space-y-6">
      <motion.span
        aria-hidden="true"
        className="absolute bottom-4 left-4 top-4 w-px origin-top bg-[#E4E4E7]"
        initial={still ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      {steps.map(({ title, body }, i) => (
        <motion.li
          key={title}
          className="relative flex gap-4"
          initial={still ? false : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE, delay: i * 0.2 }}
        >
          <motion.span
            className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#09090B] text-sm font-semibold text-white"
            initial={still ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: i * 0.2 }}
          >
            {i + 1}
          </motion.span>
          <div>
            <p className="font-semibold text-[#09090B]">{title}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-[#52525B]">{body}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

// ── Preguntas frecuentes (acordeón accesible) ─────────────────────────────────
// Las respuestas siempre están en el DOM (colapsadas con altura 0), así que
// llegan en el HTML para buscadores y lectores de pantalla.

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const still = !!useReducedMotion();
  return (
    <div className="mt-6 divide-y divide-[#E4E4E7] border-y border-[#E4E4E7]">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        return (
          <div key={q} className="py-4">
            <h3>
              <button
                type="button"
                id={`faq-btn-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 rounded-md text-left font-medium text-[#09090B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C] focus-visible:ring-offset-2"
              >
                {q}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-[#D42F3C] text-white" : "bg-[#F4F4F5] text-[#71717A]"}`}
                >
                  <Plus className="size-4" />
                </motion.span>
              </button>
            </h3>
            <motion.div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
              inert={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: still ? 0 : 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="pt-3 text-[15px] leading-relaxed text-[#52525B]">{a}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ── Botón principal ───────────────────────────────────────────────────────────

const MotionLink = motion.create(Link);

/** Enlace-botón con respuesta al puntero; `pulse` suma un anillo que late para llamar la atención. */
export function Cta({
  href,
  className,
  children,
  pulse = false,
}: {
  href: string;
  className: string;
  children: ReactNode;
  pulse?: boolean;
}) {
  const still = !!useReducedMotion();
  return (
    <span className="relative block">
      {pulse && !still && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#D42F3C]"
          animate={{ scale: [1, 1.08, 1.08], opacity: [0.55, 0, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", repeatDelay: 1.2 }}
        />
      )}
      <MotionLink
        href={href}
        className={className}
        whileHover={still ? undefined : { y: -2 }}
        whileTap={still ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {children}
      </MotionLink>
    </span>
  );
}
