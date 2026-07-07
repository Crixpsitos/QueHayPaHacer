import type { LocationDetail, CityDetail } from "@/domain/shared/LocationDetail";

// Re-export para no romper imports existentes que tomaban `LocationDetail` de aquí.
export type { LocationDetail, CityDetail };

export interface Location {
  /**
   * Si la location es un sitio registrado en NUESTRA plataforma, su id.
   * `null`/ausente = venue externo (no es un sitio nuestro). Es la relación
   * evento→sitio: `getEventsBySite` filtra por `location.siteId`.
   */
  siteId?: string | null;
  city: CityDetail;
  venue: string;
  address: string;
  moreInfo?: string;

  department: LocationDetail;
  country: LocationDetail;

  coordinates: {
    lat: number;
    lng: number;
  };
}
