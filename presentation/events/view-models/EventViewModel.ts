import type { CategoryInfo } from "@/domain/entities/events/value-objects/CategoryInfo";
import type { Location } from "@/domain/entities/events/value-objects/Location";
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
  description: string;
  images: ImageVariants;
  categoryInfo: CategoryInfo;
  author: {
    id: string;
    displayName: string;
    photoURL: string;
  };
  location: Location;
  status: "draft" | "published" | "cancelled" | "ended";
  registrationType: "none" | "internal" | "external" | "form";
  externalUrl?: string;
  capacity?: number;
  price: Price;
  promotion: {
    isPromoted: boolean;
    promotedAt: string;
    promotedUntil: string;
  };
  analytics?: {
    views?: number;
    likes?: number;
    clicks?: number;
    registrations?: number;
    score?: number;
  };
  // Fechas como strings ISO 8601
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
