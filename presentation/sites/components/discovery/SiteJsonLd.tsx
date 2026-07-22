import { SITE_URL } from "@/app/lib/site";
import type { SiteDetail } from "../../view-models/SiteFormViewModel";

/** Tipo de sitio → tipo schema.org más específico (mejor elegibilidad rich results). */
const SCHEMA_TYPE: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
  bar: "BarOrPub",
  discotheque: "NightClub",
  mall: "ShoppingCenter",
  park: "Park",
  museum: "Museum",
  cultural: "TouristAttraction",
  viewpoint: "TouristAttraction",
  hostel: "Hostel",
  hotel: "Hotel",
  gym: "ExerciseGym",
  spa: "DaySpa",
  theater: "PerformingArtsTheater",
  other: "LocalBusiness",
};

/**
 * JSON-LD por sitio → elegibilidad para rich results de negocio local en Google.
 * Ibagué/Tolima fijos (feature mono-ciudad). Geo solo si hay coordenadas.
 * ponytail: locality/region hardcoded; leer de un campo city cuando haya multi-ciudad.
 */
export function SiteLocalBusinessJsonLd({ site }: { site: SiteDetail }) {
  const { latitude, longitude } = site.coordinates ?? {};
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[site.category] ?? "LocalBusiness",
    name: site.name,
    url: `${SITE_URL}/sites/${site.id}`,
    ...(site.coverUrl ? { image: site.coverUrl } : {}),
    ...(site.description ? { description: site.description } : {}),
    ...(site.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: site.address,
            addressLocality: "Ibagué",
            addressRegion: "Tolima",
            addressCountry: "CO",
          },
        }
      : {}),
    ...(latitude && longitude
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/** ItemList JSON-LD → elegibilidad para carrusel en Google (URLs absolutas). */
export function SiteItemListJsonLd({ sites }: { sites: SiteDetail[] }) {
  if (sites.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: sites.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/sites/${s.id}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
