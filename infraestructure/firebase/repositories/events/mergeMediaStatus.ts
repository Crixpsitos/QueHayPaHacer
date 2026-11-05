// El CF de optimización marca los medios como "ready"/"error" mientras el wizard sigue guardando borradores con la
// copia local (aún "processing"). Sin esto, ese guardado deshace el trabajo del CF y el medio queda "procesando".

type Status = "processing" | "ready" | "error"
type Item = { id: string; data?: unknown }
type MainImage = { url?: string; path?: string; status?: Status }
type Stored = { media?: Item[]; mainImage?: MainImage }

const statusOf = (m: Item) => (m.data as { status?: Status } | undefined)?.status
const done = (s?: Status) => s === "ready" || s === "error"

/**
 * Ruta que genera `compressImage` (functions) para una subida `deoptimized-*`.
 * ponytail: refleja el nombre del CF a mano; si cambia allí, cambiarlo aquí (hay test).
 */
export function optimizedPathFor(path: string): string {
  const slash = path.lastIndexOf("/")
  const dir = path.slice(0, slash + 1)
  const file = path.slice(slash + 1)
  const dot = file.lastIndexOf(".")
  const base = (dot > 0 ? file.slice(0, dot) : file).replace(/^deoptimized[-_]?/i, "")
  return `${dir}optimized_${base}.webp`
}

/** Devuelve `event` con los medios que el CF ya terminó en lugar de la copia local en "processing". No muta. */
export function mergeMediaStatus<T extends { media?: Item[]; mainImage?: MainImage } | object>(event: T, stored: Stored | undefined): T {
  if (!stored) return event
  const out = { ...event } as T & Stored
  const { media, mainImage: main } = event as Stored

  if (media && stored.media) {
    const byId = new Map(stored.media.map((m) => [m.id, m]))
    out.media = media.map((m) => {
      const s = byId.get(m.id)
      return statusOf(m) === "processing" && s && done(statusOf(s)) ? s : m
    })
  }

  const sMain = stored.mainImage
  if (main?.status === "processing" && main.path && sMain && done(sMain.status) && sMain.path === optimizedPathFor(main.path)) {
    out.mainImage = sMain
  }

  return out
}
