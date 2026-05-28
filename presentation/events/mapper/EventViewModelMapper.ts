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
      mainImage: event.mainImage,
      media: event.media,
      categoryInfo: event.categoryInfo,
      author: {
        id: event.author?.id,
        displayName: event.author?.displayName,
        photoURL: event.author?.photoURL,
      },
      location: event.location,
      status: event.status,
      registrationType: event.registrationType,
      externalUrl: event.externalUrl,
      capacity: event.capacity,
      price: event.price,
      promotion: event.promotion ? {
        isPromoted: event.promotion.isPromoted ?? false,
        promotedAt: event.promotion.promotedAt?.toISOString(),
        promotedUntil: event.promotion.promotedUntil?.toISOString(),
      } : {
        isPromoted: false,
        promotedAt: undefined,
        promotedUntil: undefined,
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
      startDate: event.startDate?.toISOString(),
      endDate: event.endDate?.toISOString(),
      createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString() ?? new Date().toISOString(),
      publishedAt: event.publishedAt?.toISOString(),
    };
  }

  static toViewModels(events: Events[]): EventViewModel[] {
    return events.map((event) => this.toViewModel(event));
  }

  static toDomain(viewModel: EventViewModel): Events {
    return {
      id: viewModel.id,
      slug: viewModel.slug,
      title: viewModel.title,
      shortDescription: viewModel.shortDescription,
      description: viewModel.description,
      mainImage: viewModel.mainImage,
      media: viewModel.media,
      categoryInfo: viewModel.categoryInfo,
      author: {
        id: viewModel.author?.id,
        displayName: viewModel.author?.displayName,
        photoURL: viewModel.author?.photoURL,
      },
      location: viewModel.location,
      status: viewModel.status,
      registrationType: viewModel.registrationType,
      externalUrl: viewModel.externalUrl,
      capacity: viewModel.capacity,
      price: viewModel.price,
      promotion: viewModel.promotion ? {
        isPromoted: viewModel.promotion.isPromoted ?? false,
        promotedAt: viewModel.promotion.promotedAt ? new Date(viewModel.promotion.promotedAt) : undefined,
        promotedUntil: viewModel.promotion.promotedUntil ? new Date(viewModel.promotion.promotedUntil) : undefined,
      } : {
        isPromoted: false,
        promotedAt: undefined,
        promotedUntil: undefined,
      },
      analytics: viewModel.analytics
        ? {
            views: viewModel.analytics.views,
            clicks: viewModel.analytics.clicks,
            registrations: viewModel.analytics.registrations,
            score: viewModel.analytics.score,
            likes: viewModel.analytics.likes,
          }
        : undefined,
      startDate: viewModel.startDate ? new Date(viewModel.startDate) : undefined,
      endDate: viewModel.endDate ? new Date(viewModel.endDate) : undefined,
      createdAt: viewModel.createdAt ? new Date(viewModel.createdAt) : new Date(),
      updatedAt: viewModel.updatedAt ? new Date(viewModel.updatedAt) : new Date(),
      publishedAt: viewModel.publishedAt ? new Date(viewModel.publishedAt) : undefined,
    } as unknown as Events;
  }
}