"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { notify } from "@/presentation/shared/lib/notify";
import { cn } from "@/app/lib/utils/cn";

/** Copia `text` al portapapeles y confirma con "Copiado" (también para lectores de pantalla). */
export function CopyButton({ text, label = "Copiar", ariaLabel, className }: { text: string; label?: string; ariaLabel?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch {
      notify.error("No se pudo copiar. Selecciona el texto y cópialo a mano.");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={ariaLabel}
      className={cn("inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", className)}
    >
      {done ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{done ? "Copiado" : label}</span>
    </button>
  );
}
