"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { SPRING_SNAPPY } from "@/app/components/motion/primitives";
import { useState } from "react";

const BURST = [0, 60, 120, 180, 240, 300];

/** Corazón de la tarjeta: "pop" con resorte y una ráfaga corta al dar me gusta. Área táctil 44px. */
export function CardLikeButton({ liked, onToggle }: { liked: boolean; onToggle: () => void }) {
  const still = useReducedMotion();
  // La ráfaga solo se dispara por un clic del usuario, no cuando llega el estado inicial.
  const [burstKey, setBurstKey] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        if (!liked) setBurstKey((k) => k + 1);
        onToggle();
      }}
      aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      aria-pressed={liked}
      className="absolute right-1.5 top-1.5 z-10 flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
    >
      <span className="relative flex size-9 items-center justify-center rounded-full bg-white/90 text-[#09090B] ring-1 ring-black/5 transition-colors hover:bg-white">
        <motion.span
          className="flex"
          animate={still ? undefined : { scale: liked ? [1, 1.35, 1] : 1 }}
          transition={liked ? { duration: 0.32, ease: "easeOut" } : SPRING_SNAPPY}
          whileTap={still ? undefined : { scale: 0.85 }}
        >
          <Heart
            className={cn("size-5 transition-colors duration-150", liked && "fill-[#E63946] text-[#E63946]")}
            aria-hidden="true"
          />
        </motion.span>
        <AnimatePresence>
          {!still &&
            burstKey > 0 &&
            BURST.map((deg) => (
              <motion.span
                key={`${burstKey}-${deg}`}
                aria-hidden="true"
                className="pointer-events-none absolute size-1 rounded-full bg-[#E63946]"
                initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                animate={{
                  x: Math.cos((deg * Math.PI) / 180) * 18,
                  y: Math.sin((deg * Math.PI) / 180) * 18,
                  opacity: 0,
                  scale: 0.4,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>
      </span>
    </button>
  );
}
