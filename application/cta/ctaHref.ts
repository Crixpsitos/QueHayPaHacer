import { CTA } from "./types";

// Las campañas en Firestore guardan `{ label, href }`; el tipo CTA nuevo es `{ type, entity }`. Se aceptan ambos.
type LegacyCTA = { label: string; href: string };

/** URL de un CTA para pintarlo como enlace real (abrir en pestaña nueva, rastreadores). `undefined` si no hay destino. */
export const ctaHref = (cta: CTA | LegacyCTA): string | undefined => {
  if ("href" in cta && cta.href) return cta.href;
  if (!("entity" in cta) || !cta.entity) return undefined;
  if (cta.type === "external_link") return cta.entity.path;
  const query = new URLSearchParams(
    Object.entries(cta.entity.params ?? {}).map(([k, v]) => [k, String(v)]),
  ).toString();
  return `/${cta.entity.resource}/${cta.entity.path}${query ? `?${query}` : ""}`;
};
