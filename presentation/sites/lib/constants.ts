import type {
  ModerationStatus, PublicationStatus,
  SiteCategory, SiteDisplayStatus, SiteFilterTab,
  SiteSchedule, WeekDay,
} from "../view-models/SiteFormViewModel"

export const IBAGUE_CENTER = { latitude: 4.4389, longitude: -75.2322 }
export const DEFAULT_ZOOM = 13

export const CATEGORY_OPTIONS: { value: SiteCategory; label: string }[] = [
  { value: "restaurant",  label: "Restaurante" },
  { value: "cafe",        label: "Café" },
  { value: "bar",         label: "Bar" },
  { value: "discotheque", label: "Discoteca" },
  { value: "mall",        label: "Centro comercial" },
  { value: "park",        label: "Parque" },
  { value: "museum",      label: "Museo" },
  { value: "cultural",    label: "Cultural" },
  { value: "viewpoint",   label: "Mirador" },
  { value: "hostel",      label: "Hostal" },
  { value: "hotel",       label: "Hotel" },
  { value: "gym",         label: "Gimnasio" },
  { value: "spa",         label: "Spa" },
  { value: "theater",     label: "Teatro" },
  { value: "other",       label: "Otro" },
]

const CATEGORY_LABELS = new Map<SiteCategory, string>(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
)

/** Etiqueta en español de una categoría de sitio. Cae al valor crudo si no la conoce. */
export function siteCategoryLabel(value: string): string {
  return CATEGORY_LABELS.get(value as SiteCategory) ?? value
}

export const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

export const DEFAULT_SCHEDULE: SiteSchedule = {
  monday:    { open: "08:00", close: "20:00", closed: false },
  tuesday:   { open: "08:00", close: "20:00", closed: false },
  wednesday: { open: "08:00", close: "20:00", closed: false },
  thursday:  { open: "08:00", close: "22:00", closed: false },
  friday:    { open: "08:00", close: "22:00", closed: false },
  saturday:  { open: "09:00", close: "22:00", closed: false },
  sunday:    { open: "09:00", close: "14:00", closed: true },
}

export function getDisplayStatus(pub: PublicationStatus, mod: ModerationStatus): SiteDisplayStatus {
  if (pub === "draft") return "draft"
  if (mod === "approved") return "approved"
  if (mod === "rejected") return "rejected"
  return "pending"
}

export interface StatusColor {
  hex: string
  ring: string
  badge: string
  dotBg: string
}

export const STATUS_COLORS: Record<SiteDisplayStatus, StatusColor> = {
  approved: { hex: "#10b981", ring: "border-[#10b981]", badge: "bg-emerald-500/12 text-emerald-700", dotBg: "bg-[#10b981]" },
  pending:  { hex: "#f59e0b", ring: "border-[#f59e0b]", badge: "bg-amber-500/15 text-amber-700",   dotBg: "bg-[#f59e0b]" },
  rejected: { hex: "#ef4444", ring: "border-[#ef4444]", badge: "bg-red-500/12 text-red-700",       dotBg: "bg-[#ef4444]" },
  draft:    { hex: "#94a3b8", ring: "border-[#94a3b8]", badge: "bg-muted text-muted-foreground",   dotBg: "bg-[#94a3b8]" },
}

export const STATUS_LABELS: Record<SiteDisplayStatus, string> = {
  approved: "Aprobado",
  pending:  "En revisión",
  rejected: "Rechazado",
  draft:    "Borrador",
}

export const FILTER_TABS: { key: SiteFilterTab; label: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "approved", label: "Aprobados" },
  { key: "pending",  label: "Pendientes" },
  { key: "rejected", label: "Rechazados" },
  { key: "draft",    label: "Borradores" },
]

export function createInitialForm() {
  return {
    coordinates: null,
    address: "",
    city: "Ibagué",
    citySlug: "ibague",
    region: "Tolima",
    regionSlug: "tolima",
    country: "Colombia",
    countrySlug: "colombia",
    name: "",
    description: "",
    category: "" as const,
    media: [],
    schedule: structuredClone(DEFAULT_SCHEDULE),
    socialMedia: {},
    temporarilyClosed: { isClosed: false, reason: "" },
    bookingUrl: "",
  }
}
