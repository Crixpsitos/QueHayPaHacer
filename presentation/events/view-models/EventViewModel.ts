import type { CategoryInfo } from "@/domain/entities/events/value-objects/CategoryInfo";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import { MediaItem } from "@/domain/entities/events/value-objects/Media";
import type { Price } from "@/domain/entities/events/value-objects/Price";
import type { ImageVariants } from "@/domain/shared/ImageVariants";

/**
 * ViewModel de Events para la capa de presentación.
 * Todas las fechas se representan como string ISO 8601.
 */
export interface EventViewModel {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: {
    type: "doc";
    content?: {
      type: string;
      content?: {
        type: string;
        text?: string;
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        content?: any[];
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        attrs?: Record<string, any>;
      }[];
    };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    attrs: Record<string, any>;
  }
  mainImage?: { url: string; path?: string; status?: "processing" | "ready" | "error"; temporaryUrl?: string };

  media: MediaItem[];
  categoryInfo: CategoryInfo;
  author: {
    id: string;
    displayName: string;
    photoURL: string;
  };
  location: Location;
  status: "draft" | "published" | "cancelled" | "ended";
  registrationType: "none" | "internal" | "external" | "form";
  registrationEventForm?: {
    fields: {
      id: string;
      type: string;
      label: string;
      placeholder?: string;
      required: boolean;
      options?: string[];
    }[];
  };
  externalUrl?: string;
  capacity?: number;
  requiresAttendance?: boolean;
  price: Price;
  promotion: {
    isPromoted: boolean;
    promotedAt?: string;
    promotedUntil?: string;
  };
  analytics?: {
    views?: number;
    likes?: number;
    clicks?: number;
    registrations?: number;
    shares?: number;
    score?: number;
  };
  eventType?: "standard" | "multi-date";
  // Fechas como strings ISO 8601
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
