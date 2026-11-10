"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useOptimistic, useRef, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { navToSearch, nextNav, type Nav, type NavOption } from "@/presentation/studio/lib/panelNav";

interface Ctx { nav: Nav; pending: boolean; go: (patch: Partial<Nav>) => void }
const PanelNavContext = createContext<Ctx | null>(null);

export function usePanelNav(): Ctx {
  const c = useContext(PanelNavContext);
  if (!c) throw new Error("usePanelNav va dentro de <PanelNavProvider>");
  return c;
}

/**
 * Controla qué mira el panel (ficha, período, tipo). Resalta AL INSTANTE lo que se toca (useOptimistic) y compone cada toque
 * sobre el ÚLTIMO estado (una ref), no sobre la última pantalla dibujada: así dos clics rápidos ("90 días" y enseguida otra
 * ficha) no se pisan. La URL se actualiza dentro de una transición: si llega otro toque, el último gana.
 */
export function PanelNavProvider({ f, d, t, options, children }: { f: Nav["f"]; d: Nav["d"]; t: Nav["t"]; options: NavOption[]; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const server = useMemo<Nav>(() => ({ f, d, t }), [f, d, t]);
  const [nav, setOptimistic] = useOptimistic<Nav, Nav>(server, (_current, next) => next);
  const [pending, startTransition] = useTransition();
  const latest = useRef(server);
  // Con la transición terminada, lo que mandó el servidor es la verdad; mientras hay toques en vuelo, manda el último toque.
  useEffect(() => { if (!pending) latest.current = server; }, [server, pending]);

  const go = useCallback(
    (patch: Partial<Nav>) => {
      const next = nextNav(options, latest.current, patch);
      latest.current = next;
      startTransition(() => {
        setOptimistic(next);
        router.replace(`${pathname}?${navToSearch(next)}`, { scroll: false });
      });
    },
    [options, pathname, router, setOptimistic],
  );

  return <PanelNavContext.Provider value={{ nav, pending, go }}>{children}</PanelNavContext.Provider>;
}

/** Atenúa el contenido mientras llega el nuevo, para que se vea que está cargando y no que se "trabó". */
export function PanelBody({ children }: { children: ReactNode }) {
  const { pending } = usePanelNav();
  return <div aria-busy={pending} className={pending ? "space-y-6 opacity-60 transition-opacity" : "space-y-6 transition-opacity"}>{children}</div>;
}
