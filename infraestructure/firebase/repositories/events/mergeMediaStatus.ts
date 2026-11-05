// El CF de optimización marca los medios como "ready"/"error" mientras el wizard sigue guardando borradores con la
// copia local (aún "processing"). Sin esto, ese guardado deshace el trabajo del CF y el medio queda "procesando".

type Status = "processing" | "ready" | "error"
type Item = { id: string; data?: unknown }
type MainImage = { url?: string; path?: string; originalPath?: string; status?: Status }
type Stored = { media?: Item[]; mainImage?: MainImage }

const statusOf = (m: Item) => (m.data as { status?: Status } | undefined)?.status
const done = (s?: Status) => s === "ready" || s === "error"

/** Devuelve `event` con los medios que el CF ya terminó en lugar de la copia local en "processing". No muta. */
export function mergeMediaStatus<T extends { media?: Item[]; mainImage?: MainImage } | object>(event: T, stored: Stored | undefined): T {
  if (!stored) return event
  const out = { ...event } as T & Stored
  const { media, mainImage: main } = event as Stored

  if (media && stored.media) {
    const byId = new Map(stored.media.map((m) => [m.id, m]))
    out.media = media.map((m) => {
      const s = byId.get(m.id)
      if (!s) return m
      const local = statusOf(m)
      const remote = statusOf(s)
      // "error" local con "ready" guardado: la subida llegó pese al error del navegador (p. ej. respuesta perdida).
      const stale = (local === "processing" && done(remote)) || (local === "error" && remote === "ready")
      return stale ? s : m
    })
  }

  const sMain = stored.mainImage
  // El CF guarda `mainImage.originalPath` = la subida que terminó; así una re-subida con el mismo nombre (otro uuid)
  // nunca adopta el resultado de la anterior.
  if (main?.status === "processing" && main.path && sMain && done(sMain.status) && sMain.originalPath === main.path) {
    out.mainImage = sMain
  }

  return out
}
