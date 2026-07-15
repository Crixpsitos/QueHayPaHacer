import { ImageVariants } from "@/domain/shared/ImageVariants";
import { Location } from "./value-objects/Location";
import { Dates } from "./value-objects/Dates";
import { Price } from "./value-objects/Price";
import { Promotion } from "./value-objects/Promotion";
import { CategoryInfo } from "./value-objects/CategoryInfo";
import { MediaItem } from "./value-objects/Media";

export interface Events extends Dates {
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
  };
  mainImage?: { url: string; path?: string; status?: "processing" | "ready" | "error"; temporaryUrl?: string };

  media: MediaItem[];
  categoryInfo: CategoryInfo
  author: {
    id: string;
    displayName: string;
    photoURL: string;
  };
  location: Location;
  status: "draft" | "published" | "cancelled" | "ended";
  registrationType: "none" | "internal" | "external" | "form";
  registrationEventForm?: {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any[];
  };
  externalUrl?: string;
  capacity?: number;
  /** Si el organizador llevará control de asistencia (check-in) de los inscritos. */
  requiresAttendance?: boolean;
  price: Price;
  promotion: Promotion;
  /** "standard" = evento único (comportamiento actual). "multi-date" = evento con sesiones (solo profesionales). */
  eventType?: "standard" | "multi-date";
  analytics?: {
    views?: number;
    clicks?: number;
    likes?: number;
    registrations?: number;
    score?: number;
  };
}
