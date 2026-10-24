import { FirebaseEventsDto } from "../../dto/events/FirebaseEventsDto";
import type { PaginatedEventIds } from "@/domain/repository/events/IEventsRepository";

export interface IEventsFirebaseRepository {
    findFeaturedEvents(): Promise<string[]>;
    findWeekendEvents(): Promise<string[]>;
    findAllEvents(): Promise<string[]>;
    /** Eventos publicados y vigentes para el sitemap (slug + última edición). */
    findSitemapEntries(limit: number): Promise<{ id: string; slug: string; updatedAt: Date | null }[]>;
    findAllPaginated(limit: number, cursor: string | null): Promise<PaginatedEventIds>;
    findByTopCategory(categoryIds: string[]): Promise<string[]>;
    findByCategoryPaginated(categoryId: string, categorySlug: string | null, limit: number, cursor: string | null): Promise<PaginatedEventIds>;
    findLastDraftEventToUser(userId: string): Promise<FirebaseEventsDto | null>;
    findDraftEventByIdAndUser(id: string, userId: string): Promise<FirebaseEventsDto | null>;
    createDraftEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto>;
    updateEvent(event: FirebaseEventsDto): Promise<void>;
    updateEventDateRange(eventId: string, startDate: Date, endDate: Date): Promise<void>;
    findById(id: string): Promise<FirebaseEventsDto | null>;
    findBySlug(slug: string): Promise<FirebaseEventsDto | null>;
    incrementLikes(eventId: string, delta: number): Promise<void>;
    incrementShares(eventId: string, delta: number): Promise<void>;
    createEvent(event: FirebaseEventsDto): Promise<FirebaseEventsDto>;
    findPublishedBySiteId(siteId: string, limit?: number): Promise<FirebaseEventsDto[]>;
    updateSiteIds(eventId: string, siteIds: string[]): Promise<string[]>;
    deleteEvent(id: string): Promise<void>;
}