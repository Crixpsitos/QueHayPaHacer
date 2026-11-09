/** Acciones que se miden en la ficha pública de un evento (ver SPEC-analytics-v2.md, módulo measure). */
export const EVENT_TRACK_TYPES = ["view", "directions", "website", "booking", "whatsapp", "share", "register_external", "call"] as const
export type EventTrackType = (typeof EVENT_TRACK_TYPES)[number]

export const isEventTrackType = (v: unknown): v is EventTrackType => EVENT_TRACK_TYPES.includes(v as EventTrackType)
