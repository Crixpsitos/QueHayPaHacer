import { Events } from "@/domain/entities/events/Events";
import { IBaseRepository } from "../IBaseRepository";

/** Página de IDs de eventos + cursor opaco para la siguiente (null = no hay más). */
export interface PaginatedEventIds {
    ids: string[];
    nextCursor: string | null;
}

export interface IEventsRepository extends IBaseRepository<Events>{
    findFeaturedEvents(): Promise<string[]>;
    findWeekendEvents(): Promise<string[]>;
    findByTopCategory(categoryIds: string[]): Promise<string[]>;
    /** Paginación por cursor de una categoría (por su docId). orderBy score +
     *  tiebreaker documentId (cursor estable, sin índice extra). Solo próximos. */
    findByCategoryPaginated(categoryId: string, limit: number, cursor: string | null): Promise<PaginatedEventIds>;
    findAllPublished(): Promise<string[]>;
    findLastDraftEventToUser(userId: string): Promise<Events | null>;
    findDraftEventByIdAndUser(id: string, userId: string): Promise<Events | null>;
    findBySlug(slug: string): Promise<Events | null>;
    createDraftEvent(event: Events): Promise<Events>;
    createEvent(event: Events): Promise<Events>;
    updateEvent(event: Events): Promise<void>;
    /** Escribe solo startDate/endDate (merge). Usado para sincronizar el rango
     *  de fechas de un evento multi-date desde sus sesiones. */
    updateEventDateRange(eventId: string, startDate: Date, endDate: Date): Promise<void>;

    incrementLikes(eventId: string, delta: number): Promise<void>;    
    incrementShares(eventId: string, delta: number): Promise<void>;
    /** Eventos publicados vinculados a un sitio por location.siteId. */
    findPublishedBySiteId(siteId: string, limit?: number): Promise<Events[]>;
}