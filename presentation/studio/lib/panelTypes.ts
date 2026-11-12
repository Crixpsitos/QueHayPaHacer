import type { FichaType } from "./panelNav"

/** Ficha publicada (evento, sitio o actividad) que aparece en el panel. `slug` solo para actividades (su página pública). */
export interface FichaRef { type: FichaType; id: string; name: string; image?: string; slug?: string }
/** Enlace propio creado a mano (T10/T11). */
export interface LinkRow { code: string; label: string; targetType: "event" | "site"; targetId: string; targetName: string; clicks: number }
