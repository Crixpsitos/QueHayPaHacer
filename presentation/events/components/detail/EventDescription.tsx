"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { renderDescriptionHTML } from "@/presentation/events/lib/renderDescription";

const COLLAPSED_PX = 320;

/** Descripción rica (Tiptap JSON), renderizada sin DOM para que llegue en el HTML del SSR. */
export function EventDescription({ doc }: { doc: unknown }) {
  const html = useMemo(() => renderDescriptionHTML(doc), [doc]);

  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.scrollHeight > COLLAPSED_PX) setOverflows(true);
  }, [html]);

  // Documento vacío de Tiptap → "<p></p>"
  if (!html.replace(/<[^>]*>/g, "").trim()) return null;

  const faded = overflows && !expanded;

  return (
    <section aria-labelledby="sobre-el-evento" className="space-y-4">
      <h2 id="sobre-el-evento" className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">
        Sobre este evento
      </h2>
      <div
        ref={ref}
        className="relative overflow-hidden"
        // Recortado desde el SSR para no mover el layout al hidratar.
        style={expanded ? undefined : { maxHeight: COLLAPSED_PX }}
      >
        <div
          className="tiptap prose prose-zinc max-w-[68ch] text-[#3F3F46] prose-headings:font-heading prose-a:text-[#E63946]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {faded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#FAFAFC] to-transparent" />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#09090B] underline decoration-[#E4E4E7] underline-offset-4 hover:decoration-[#09090B]"
        >
          {expanded ? <>Leer menos <ChevronUp className="size-4" /></> : <>Leer todo <ChevronDown className="size-4" /></>}
        </button>
      )}
    </section>
  );
}
