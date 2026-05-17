import { CategoryInfo } from "@/domain/entities/events/value-objects/CategoryInfo";
import type { Location } from "@/domain/entities/events/value-objects/Location";
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
    promotion: FirebasePromotionDto;
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