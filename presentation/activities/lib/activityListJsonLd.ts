/** JSON-LD de una lista de actividades (`ItemList`) más las migas de pan. Solo datos reales de la página. */
export function activityListJsonLd(o: { siteUrl: string; path: string; name: string; items: { slug: string; title: string }[] }): Record<string, unknown>[] {
  const url = `${o.siteUrl}${o.path}`
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: o.name,
      url,
      itemListElement: o.items.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.title, url: `${o.siteUrl}/actividades/${a.slug}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: o.siteUrl },
        { "@type": "ListItem", position: 2, name: "Actividades", item: `${o.siteUrl}/actividades` },
        { "@type": "ListItem", position: 3, name: o.name, item: url },
      ],
    },
  ]
}

/** Para `dangerouslySetInnerHTML`: escapa `<` para que un título no pueda cerrar el script. */
export const activityListJsonLdHtml = (o: Parameters<typeof activityListJsonLd>[0]): string => JSON.stringify(activityListJsonLd(o)).replace(/</g, "\\u003c")
