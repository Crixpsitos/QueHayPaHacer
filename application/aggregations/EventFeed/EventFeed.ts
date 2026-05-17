import type { EventInteractions } from "@/domain/entities/EventInteractions/EventInteractions";
import type { Events } from "@/domain/entities/events/Events";
import type { EventInteractionsService } from "@/application/services/events/EventInteractionsService";
import type { EventsService } from "@/application/services/events/EventsService";

export interface EventFeedItem {
	event: Events;
	interaction?: EventInteractions | null;
}

export class EventFeed {
	constructor(
		private readonly eventsService: EventsService,
		private readonly interactionsService: EventInteractionsService,
	) {}

	async getFeatured(userId?: string): Promise<EventFeedItem[]> {
		const events = await this.eventsService.getFeaturedEvents();

		const items = await Promise.all(
			events.map(async (event) => {
				const interaction = userId
					? await this.interactionsService.getByEventAndUser(event.id, userId)
					: null;

				return { event, interaction };
			}),
		);


		return items;
	}

	async getEventDetailsById(
		eventId: string,
		userId?: string,
	): Promise<EventFeedItem | null> {
		const event = await this.eventsService.getEventById(eventId);
		if (!event) return null;

		const interaction = userId
				? await this.interactionsService.getByEventAndUser(event.id, userId)
			: null;

		return { event, interaction };
	}
}