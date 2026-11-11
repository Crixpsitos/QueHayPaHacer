import type { ActivityPageData } from "@/presentation/activities/data/fetchers"

const OUTDOOR = new Set(["aire-libre", "turismo-y-paseos"])

/**
 * JSON-LD de la ficha: `Service` (o `TouristAttraction` en aire libre y turismo) con sus ofertas en COP, más las migas de pan.
 * Todo sale de datos reales; sin `AggregateRating` hasta que existan reseñas (fase 3).
 */
export function activityJsonLd(a: ActivityPageData, siteUrl: string): Record<string, unknown>[] {
  const url = `${siteUrl}/actividades/${a.slug}`
  return [
    {
      "@context": "https://schema.org",
      "@type": OUTDOOR.has(a.categorySlug) ? "TouristAttraction" : "Service",
      name: a.title,
      description: (a.tagline || a.description).slice(0, 300),
      url,
      ...(a.gallery.length ? { image: a.gallery.slice(0, 5).map((g) => g.url) } : {}),
      provider: { "@type": "Organization", name: a.host.displayName },
      areaServed: { "@type": "City", name: "Ibagué" },
      offers: a.prices.map((p) => ({ "@type": "Offer", name: p.label, price: p.amountCop, priceCurrency: "COP", url })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Actividades", item: `${siteUrl}/actividades` },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
  ]
}

/** Texto para `dangerouslySetInnerHTML` de un `<script type="application/ld+json">`; `<` escapado para que un título no lo cierre. */
export const activityJsonLdHtml = (a: ActivityPageData, siteUrl: string): string => JSON.stringify(activityJsonLd(a, siteUrl)).replace(/</g, "\\u003c")
