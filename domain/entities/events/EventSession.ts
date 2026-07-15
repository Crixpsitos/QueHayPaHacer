import type { Location } from "./value-objects/Location";
import type { Price } from "./value-objects/Price";
import type { MediaItem } from "./value-objects/Media";

/**
 * Fuente de portada de una sesión:
 * - "own"    → imagen propia cargada por el organizador
 * - "parent" → hereda la portada del evento padre
 * - { sessionId } → hereda la portada de otra sesión
 */
export type SessionCoverSource = "own" | "parent" | { sessionId: string };

export interface EventSession {
  id: string;
  /** Referencia al evento padre. */
  eventId: string;
  /** Slug único DENTRO del evento, derivado del título. Usado en la URL pública
   *  (/events/{evento}/sessions/{slug}). Opcional por compatibilidad con sesiones
   *  anteriores al slug (la UI cae al id si falta). */
  slug?: string;
  /** Título opcional para diferenciar la sesión (ej: "Noche del 7 de diciembre"). */
  title?: string;
  /** Sinopsis / descripción corta de la sesión (máx 150 chars). */
  shortDescription?: string;
  /** Descripción detallada en formato TipTap JSON. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description?: { type: "doc"; content?: any[]; attrs: Record<string, any> };

  /** De dónde toma la portada esta sesión. */
  coverSource: SessionCoverSource;
  /**
   * Solo presente cuando coverSource === "own".
   * Cuando coverSource es "parent" o { sessionId }, la UI resuelve
   * la imagen desde el origen correspondiente.
   */
  mainImage?: {
    url: string;
    path?: string;
    status?: "processing" | "ready" | "error";
    temporaryUrl?: string;
  };

  /** Medios adicionales de la sesión (fotos, videos). */
  media: MediaItem[];

  location: Location;

  startDate: Date;
  endDate: Date;

  registrationType: "none" | "internal" | "external" | "form";
  externalUrl?: string;
  capacity?: number;
  requiresAttendance?: boolean;
  registrationEventForm?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any[];
  };

  price: Price;

  status: "draft" | "published" | "cancelled" | "ended";

  /** Contadores agregados propios de la sesión (like/registro por sesión). */
  analytics?: {
    likes?: number;
    views?: number;
    registrations?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
