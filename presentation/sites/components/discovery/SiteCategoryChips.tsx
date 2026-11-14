import {
  Utensils, Coffee, Wine, Music, ShoppingBag, TreePine,
  Landmark, Palette, Mountain, BedDouble, Building2,
  Dumbbell, Sparkles, Drama, MapPin, IceCreamCone, type LucideIcon,
} from "lucide-react";

/** Icono de cada tipo de sitio (cabecera de las páginas por tipo). */
export const SITE_ICON_MAP: Record<string, LucideIcon> = {
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  discotheque: Music,
  mall: ShoppingBag,
  park: TreePine,
  museum: Landmark,
  cultural: Palette,
  viewpoint: Mountain,
  hostel: BedDouble,
  hotel: Building2,
  gym: Dumbbell,
  spa: Sparkles,
  theater: Drama,
  ice_cream: IceCreamCone,
  other: MapPin,
};
