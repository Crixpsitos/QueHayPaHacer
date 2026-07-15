import type { Location } from "@/domain/entities/events/value-objects/Location";
import type { Price } from "@/domain/entities/events/value-objects/Price";
import type { MediaItem } from "@/domain/entities/events/value-objects/Media";

/**
 * ViewModel serializable de una sesión (fechas ISO 8601, portada ya resuelta).
 * La portada (`coverUrl`) se resuelve en el mapper a partir de coverSource
 * ("own" | "parent" | { sessionId }).
 */
export interface SessionViewModel {
  id: string;
  eventId: string;
  /** Slug único por evento (cae al id si la sesión es anterior al slug). */
  slug?: string;
  title: string;
  shortDescription: string;
  description?: {
    type: "doc";
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: any[];
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    attrs?: Record<string, any>;
  };
  /** URL de portada ya resuelta. */
  coverUrl?: string;
  media: MediaItem[];
  location: Location;
  startDate: string;
  endDate: string;
  registrationType: "none" | "internal" | "external" | "form";
  externalUrl?: string;
  capacity?: number;
  requiresAttendance?: boolean;
  registrationEventForm?: { fields: unknown[] };
  price: Price;
  status: "draft" | "published" | "cancelled" | "ended";
  analytics?: {
    likes?: number;
    views?: number;
    registrations?: number;
  };
}
