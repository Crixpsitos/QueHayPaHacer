/** Ficha publicada (evento o sitio) que aparece en el panel. */
export interface FichaRef { type: "event" | "site"; id: string; name: string; image?: string }
/** Enlace propio creado a mano (T10/T11). */
export interface LinkRow { code: string; label: string; targetType: "event" | "site"; targetId: string; targetName: string; clicks: number }
