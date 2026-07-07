import type { Coordinates } from "./Coordinates";
import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";

/**
 * Ubicación de un sitio. Misma forma que `Event.Location` en los objetos
 * geográficos (`country`/`department` con isoCode+name+slug, `city` con
 * name+slug), pero conserva `Coordinates` porque en Firestore el sitio se
 * guarda con GeoPoint nativo (ver `SiteFirebaseMapper`).
 *
 * NO lleva `siteId` (eso es solo de `Event.Location`: un evento puede ocurrir
 * en un sitio nuestro; la location de un sitio ES el sitio, no apunta a otro).
 */
export class SiteLocation {
  constructor(
    public readonly coordinates: Coordinates,
    public readonly country: LocationDetail,
    public readonly department: LocationDetail,
    public readonly city: CityDetail,
    public readonly address: string,
    public readonly venue: string,
    public readonly moreInfo: string = "",
  ) {}
}
