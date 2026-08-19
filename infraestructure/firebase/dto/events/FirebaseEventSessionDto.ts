import type { Timestamp, GeoPoint } from "firebase-admin/firestore";
import type { MediaItem } from "@/domain/entities/events/value-objects/Media";
import type { Price } from "@/domain/entities/events/value-objects/Price";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import type { SessionCoverSource } from "@/domain/entities/events/EventSession";

export interface FirebaseEventSessionDto {
  id: string;
  eventId: string;
  slug?: string;
  title?: string;
  shortDescription?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description?: { type: "doc"; content?: any[]; attrs: Record<string, any> };
  coverSource: SessionCoverSource;
  mainImage?: {
    url: string;
    path?: string;
    status?: "processing" | "ready" | "error";
    temporaryUrl?: string;
  };
  media: MediaItem[];
  /** Location stored with GeoPoint for coordinates. */
  location: Omit<Location, "coordinates"> & {
    coordinates: GeoPoint | { lat: number; lng: number };
  };
  startDate: Timestamp;
  endDate: Timestamp;
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
  analytics?: {
    views?: number;
    registrations?: number;
    shares?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
