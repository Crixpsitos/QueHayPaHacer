import { CategoryInfo } from "@/domain/entities/events/value-objects/CategoryInfo";
import type { Location } from "@/domain/entities/events/value-objects/Location";
import { MediaItem } from "@/domain/entities/events/value-objects/Media";
import type { Price } from "@/domain/entities/events/value-objects/Price";
import type { ImageVariants } from "@/domain/shared/ImageVariants";
import type { Timestamp } from "firebase-admin/firestore";

export interface FirebasePromotionDto {
    isPromoted: boolean;
    promotedAt: Timestamp;
    promotedUntil: Timestamp;
}

export interface FirebaseEventsDto {
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
    mainImage: { url: string; path?: string; status?: "processing" | "ready" | "error"; temporaryUrl?: string };

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
    externalUrl?: string;
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
    capacity?: number;
    requiresAttendance?: boolean;
    price: Price;
    promotion: FirebasePromotionDto;
    /** "standard" = evento único. "multi-date" = evento con sesiones (solo profesionales). */
    eventType?: "standard" | "multi-date";
    createdAt: Timestamp;
    updatedAt: Timestamp;
    publishedAt?: Timestamp;
    startDate: Timestamp;
    endDate: Timestamp;
    analytics?: {
        views?: number;
        clicks?: number;
        likes?: number;
        registrations?: number;
        score?: number;
    };
    metadata?: {
        _meiliNeedsSync?: boolean; // Flag para indicar si el evento necesita ser sincronizado con Meilisearch
        _meiliSyncedAt?: Timestamp; // Fecha de la ultima sincronizacion con Meilisearch
        _meiliSynced?: boolean; // Flag para indicar si el evento ha sido sincronizado con Meilisearch
    };
}