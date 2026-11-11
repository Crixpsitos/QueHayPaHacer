import { Mountain, Utensils, Palette, Dumbbell, Users, Music, Clapperboard, BookOpen, Hammer, ShoppingBag, Building2, Dices, Map, HeartHandshake, Sparkles, Compass, type LucideIcon } from "lucide-react"
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory"

/** Cada categoría con su color e ícono: se reconocen sin leer. Los colores son suaves para que la foto mande. */
export interface CategoryStyle { bg: string; ink: string; Icon: LucideIcon }

const S: Record<ActivityCategory, CategoryStyle> = {
  "aire-libre": { bg: "#CDEBD3", ink: "#14532D", Icon: Mountain },
  "comida-y-bebida": { bg: "#FFD9A8", ink: "#7A3E00", Icon: Utensils },
  "cultura-y-arte": { bg: "#E3D6F5", ink: "#4B2A86", Icon: Palette },
  "deporte-y-bienestar": { bg: "#BFE3F2", ink: "#0B4A66", Icon: Dumbbell },
  "en-familia": { bg: "#FFC9CF", ink: "#8A1226", Icon: Users },
  "musica-y-vida-nocturna": { bg: "#D8D4FF", ink: "#2B2478", Icon: Music },
  "cine-y-espectaculos": { bg: "#F5D0E6", ink: "#7A1650", Icon: Clapperboard },
  "lectura-y-clubes": { bg: "#FFF0A6", ink: "#5F4B00", Icon: BookOpen },
  "talleres-y-aprendizaje": { bg: "#FFD3B8", ink: "#7A2E0A", Icon: Hammer },
  "compras-y-mercados": { bg: "#D5E8C2", ink: "#2F5410", Icon: ShoppingBag },
  "espacios-y-reservas": { bg: "#D4E0EA", ink: "#1F3B52", Icon: Building2 },
  "juegos-y-diversion": { bg: "#FFE0A3", ink: "#7A4F00", Icon: Dices },
  "turismo-y-paseos": { bg: "#BDEBE4", ink: "#0C5B52", Icon: Map },
  "voluntariado-y-comunidad": { bg: "#F7CFC4", ink: "#7A2A1A", Icon: HeartHandshake },
  "fe-y-espiritualidad": { bg: "#EADFC8", ink: "#5C4410", Icon: Sparkles },
  otros: { bg: "#E4E4EA", ink: "#3F3F4A", Icon: Compass },
}

export const categoryStyle = (slug: string): CategoryStyle => S[slug as ActivityCategory] ?? S.otros
