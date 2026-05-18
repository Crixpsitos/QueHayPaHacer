import type { Events } from "@/domain/entities/events/Events";
import type { EventViewModel } from "../view-models/EventViewModel";

export class EventViewModelMapper {
  static toViewModel(event: Events): EventViewModel {
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      shortDescription: event.shortDescription,
      description: event.description,
      images: event.images,
      categoryInfo: event.categoryInfo,
      author: {
        id: event.author.id,
        displayName: event.author.displayName,
        photoURL: event.author.photoURL,
      },
      location: event.location,
      status: event.status,
      registrationType: event.registrationType,
      externalUrl: event.externalUrl,
      capacity: event.capacity,
      price: event.price,
      promotion: {
        isPromoted: event.promotion.isPromoted,
        promotedAt: event.promotion.promotedAt.toISOString(),
        promotedUntil: event.promotion.promotedUntil.toISOString(),
      },
      analytics: event.analytics
        ? {
            views: event.analytics.views,
            clicks: event.analytics.clicks,
            registrations: event.analytics.registrations,
            score: event.analytics.score,
            likes: event.analytics.likes,
          }
        : undefined,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      publishedAt: event.publishedAt?.toISOString(),
    };
  }

  static toViewModels(events: Events[]): EventViewModel[] {
    return events.map((event) => this.toViewModel(event));
  }
}
