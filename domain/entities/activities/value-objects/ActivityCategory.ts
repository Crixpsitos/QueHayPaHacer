/**
 * Categorías de actividades (spec 5.3). El slug es estable: se usa en URLs y SEO.
 * Agregar una es barato; quitar o renombrar un slug rompe URLs.
 */
export const ACTIVITY_CATEGORIES = [
  { slug: "aire-libre", name: "Aire libre y aventura" },
  { slug: "comida-y-bebida", name: "Comida y bebida" },
  { slug: "cultura-y-arte", name: "Cultura y arte" },
  { slug: "deporte-y-bienestar", name: "Deporte y bienestar" },
  { slug: "en-familia", name: "En familia" },
  { slug: "musica-y-vida-nocturna", name: "Música y vida nocturna" },
  { slug: "cine-y-espectaculos", name: "Cine y espectáculos" },
  { slug: "lectura-y-clubes", name: "Lectura y clubes" },
  { slug: "talleres-y-aprendizaje", name: "Talleres y aprendizaje" },
  { slug: "compras-y-mercados", name: "Compras y mercados" },
  { slug: "espacios-y-reservas", name: "Espacios y reservas" },
  { slug: "juegos-y-diversion", name: "Juegos y diversión" },
  { slug: "turismo-y-paseos", name: "Turismo y paseos" },
  { slug: "voluntariado-y-comunidad", name: "Voluntariado y comunidad" },
  { slug: "fe-y-espiritualidad", name: "Fe y espiritualidad" },
  { slug: "otros", name: "Otros" },
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]["slug"]

export const isActivityCategory = (x: unknown): x is ActivityCategory =>
  typeof x === "string" && ACTIVITY_CATEGORIES.some((c) => c.slug === x)

/** "otros" entra siempre a revisión manual, aunque la cuenta sea de confianza. */
export const requiresManualReview = (c: ActivityCategory): boolean => c === "otros"

/** "¿Con quién vas?" */
export const COMPANIONS = ["solo", "pareja", "familia", "amigos", "ninos", "mascotas"] as const
export type Companion = (typeof COMPANIONS)[number]
export const COMPANIONS_MAX = 6

export const isCompanion = (x: unknown): x is Companion => typeof x === "string" && (COMPANIONS as readonly string[]).includes(x)
