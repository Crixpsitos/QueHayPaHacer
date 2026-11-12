import { Mountain, Utensils, Palette, Dumbbell, Users, Music, Clapperboard, BookOpen, Hammer, ShoppingBag, Building2, Dices, Map, HeartHandshake, Sparkles, Compass, type LucideIcon } from "lucide-react"
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory"

/** Cada categoría con su ícono y un color de la marca (vinotinto, vinotinto oscuro o dorado; sin pasteles): el ícono es lo que las distingue. */
export interface CategoryStyle { bg: string; ink: string; Icon: LucideIcon }

const S: Record<ActivityCategory, CategoryStyle> = {
  "aire-libre": { bg: "#9B0A26", ink: "#FFFFFF", Icon: Mountain },
  "comida-y-bebida": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: Utensils },
  "cultura-y-arte": { bg: "#9B0A26", ink: "#FFFFFF", Icon: Palette },
  "deporte-y-bienestar": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: Dumbbell },
  "en-familia": { bg: "#FFB703", ink: "#5C0011", Icon: Users },
  "musica-y-vida-nocturna": { bg: "#9B0A26", ink: "#FFFFFF", Icon: Music },
  "cine-y-espectaculos": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: Clapperboard },
  "lectura-y-clubes": { bg: "#9B0A26", ink: "#FFFFFF", Icon: BookOpen },
  "talleres-y-aprendizaje": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: Hammer },
  "compras-y-mercados": { bg: "#FFB703", ink: "#5C0011", Icon: ShoppingBag },
  "espacios-y-reservas": { bg: "#9B0A26", ink: "#FFFFFF", Icon: Building2 },
  "juegos-y-diversion": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: Dices },
  "turismo-y-paseos": { bg: "#9B0A26", ink: "#FFFFFF", Icon: Map },
  "voluntariado-y-comunidad": { bg: "#6E0A1D", ink: "#FFFFFF", Icon: HeartHandshake },
  "fe-y-espiritualidad": { bg: "#FFB703", ink: "#5C0011", Icon: Sparkles },
  otros: { bg: "#9B0A26", ink: "#FFFFFF", Icon: Compass },
}

export const categoryStyle = (slug: string): CategoryStyle => S[slug as ActivityCategory] ?? S.otros
