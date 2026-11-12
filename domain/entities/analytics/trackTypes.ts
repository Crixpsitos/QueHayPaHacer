/** Acciones que se miden en la ficha pública de un evento (ver SPEC-analytics-v2.md, módulo measure). */
export const EVENT_TRACK_TYPES = ["view", "directions", "website", "booking", "whatsapp", "share", "register_external", "call"] as const
export type EventTrackType = (typeof EVENT_TRACK_TYPES)[number]


/** Lo que se mide desde el navegador en la ficha de una actividad. Guardar, "Yo fui" y unirse se cuentan en sus acciones de servidor. */
export const ACTIVITY_TRACK_TYPES = ["view", "directions", "cta", "share"] as const
export type ActivityTrackType = (typeof ACTIVITY_TRACK_TYPES)[number]

export const isEventTrackType = (v: unknown): v is EventTrackType => EVENT_TRACK_TYPES.includes(v as EventTrackType)
