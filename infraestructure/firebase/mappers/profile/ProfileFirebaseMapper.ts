import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";
import type {
  FirestoreDoc,
  ProfileInteractionsRaw,
} from "@/infraestructure/firebase/dto/profile/FirebaseProfileDto";

/** Docs crudos de Firestore → read-models del perfil. */
export class ProfileFirebaseMapper {
  toUserEvent(doc: FirestoreDoc): UserEvent {
    const data = doc.data;
    return {
      id: doc.id,
      title: data.title ?? "Evento sin titulo",
      description: data.shortDescription ?? "Sin descripcion",
      status: data.status ?? "draft",
      registrationType: data.registrationType ?? "none",
      createdAt: this.toDate(data.createdAt),
      startDate: this.toOptionalDate(data.startDate ?? data.start),
      endDate: this.toOptionalDate(data.endDate ?? data.end),
      image: data.mainImage?.url,
      isFree: typeof data.price?.isFree === "boolean" ? data.price.isFree : undefined,
      priceAmount: typeof data.price?.amount === "number" ? data.price.amount : undefined,
      priceCurrency: typeof data.price?.currency === "string" ? data.price.currency : undefined,
      capacity: typeof data.capacity === "number" ? data.capacity : undefined,
      location: {
        venue: typeof data.location?.venue === "string" ? data.location.venue : undefined,
        city: this.cityName(data.location?.city),
        department: typeof data.location?.department?.name === "string" ? data.location.department.name : undefined,
        country: typeof data.location?.country?.name === "string" ? data.location.country.name : undefined,
      },
      analytics: {
        views: data.analytics?.views ?? 0,
        clicks: data.analytics?.clicks ?? 0,
        likes: data.analytics?.likes ?? 0,
        shares: data.analytics?.shares ?? 0,
        registrations: data.analytics?.registrations ?? 0,
      },
    };
  }

  toUserSite(doc: FirestoreDoc): UserSite {
    const data = doc.data;
    return {
      id: doc.id,
      name: data.name ?? "Sitio sin nombre",
      address: data.address ?? "Sin direccion",
      createdAt: this.toDate(data.createdAt),
      image: data.image,
    };
  }

  toUserBadge(doc: FirestoreDoc): UserBadge {
    const data = doc.data;
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      category: data.category ?? "system",
      earnedAt: this.toDate(data.earnedAt),
    };
  }

  toUserEventInteractions(raw: ProfileInteractionsRaw): UserEventInteraction[] {
    return raw.interactions.map((doc) => {
      const data = doc.data;
      const rawType = data.type;
      const type: "like" | "comment" | "share" =
        rawType === "comment" || rawType === "share" ? rawType : "like";
      const eventId = typeof data.eventId === "string" ? data.eventId : "";
      const eventData = eventId ? raw.eventsById[eventId] : undefined;

      return {
        id: doc.id,
        eventId,
        type,
        createdAt: this.toDate(data.createdAt),
        event: eventData ? this.toEventPreview(eventData) : undefined,
      };
    });
  }

  private toEventPreview(eventObj: Record<string, unknown>): NonNullable<UserEventInteraction["event"]> {
    const priceObj =
      eventObj.price && typeof eventObj.price === "object"
        ? (eventObj.price as Record<string, unknown>)
        : undefined;

    const locationObj =
      eventObj.location && typeof eventObj.location === "object"
        ? (eventObj.location as Record<string, unknown>)
        : undefined;

    const departmentObj =
      locationObj?.department && typeof locationObj.department === "object"
        ? (locationObj.department as Record<string, unknown>)
        : undefined;

    const countryObj =
      locationObj?.country && typeof locationObj.country === "object"
        ? (locationObj.country as Record<string, unknown>)
        : undefined;

    const analyticsObj =
      eventObj.analytics && typeof eventObj.analytics === "object"
        ? (eventObj.analytics as Record<string, unknown>)
        : undefined;

    const mainImage =
      eventObj.mainImage && typeof eventObj.mainImage === "object"
        ? (eventObj.mainImage as Record<string, unknown>)
        : undefined;

    const imageUrl =
      typeof mainImage?.url === "string"
        ? mainImage.url
        : typeof mainImage?.temporaryUrl === "string"
          ? mainImage.temporaryUrl
          : undefined;

    return {
      title: typeof eventObj.title === "string" ? eventObj.title : "Evento sin título",
      image: imageUrl,
      status: typeof eventObj.status === "string" ? eventObj.status : undefined,
      startDate: this.toOptionalDate(eventObj.startDate ?? eventObj.start),
      endDate: this.toOptionalDate(eventObj.endDate ?? eventObj.end),
      isFree: typeof priceObj?.isFree === "boolean" ? priceObj.isFree : undefined,
      priceAmount: typeof priceObj?.amount === "number" ? priceObj.amount : undefined,
      priceCurrency: typeof priceObj?.currency === "string" ? priceObj.currency : undefined,
      location: {
        venue: typeof locationObj?.venue === "string" ? locationObj.venue : undefined,
        city: this.cityName(locationObj?.city),
        department:
          typeof departmentObj?.name === "string"
            ? departmentObj.name
            : typeof locationObj?.department === "string"
              ? locationObj.department
              : undefined,
        country:
          typeof countryObj?.name === "string"
            ? countryObj.name
            : typeof locationObj?.country === "string"
              ? locationObj.country
              : undefined,
      },
      analytics: {
        likes: typeof analyticsObj?.likes === "number" ? analyticsObj.likes : undefined,
        views: typeof analyticsObj?.views === "number" ? analyticsObj.views : undefined,
        registrations:
          typeof analyticsObj?.registrations === "number"
            ? analyticsObj.registrations
            : undefined,
      },
    };
  }

  /** `location.city` puede ser string (forma vieja) u objeto `{name}` (nueva). Devuelve el nombre. */
  private cityName(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof (value as { name?: unknown }).name === "string") {
      return (value as { name: string }).name;
    }
    return undefined;
  }

  private toDate(value: unknown): Date {
    if (!value) {
      return new Date();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    if (typeof value === "object" && value !== null && "toDate" in value) {
      const dateValue = (value as { toDate: () => Date }).toDate();
      return dateValue instanceof Date ? dateValue : new Date();
    }

    if (typeof value === "object" && value !== null) {
      const timestamp = value as {
        seconds?: number;
        nanoseconds?: number;
        _seconds?: number;
        _nanoseconds?: number;
      };

      const seconds =
        typeof timestamp.seconds === "number"
          ? timestamp.seconds
          : typeof timestamp._seconds === "number"
            ? timestamp._seconds
            : undefined;

      if (typeof seconds === "number") {
        return new Date(seconds * 1000);
      }
    }

    return new Date();
  }

  private toOptionalDate(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    if (typeof value === "object" && value !== null && "toDate" in value) {
      const dateValue = (value as { toDate: () => Date }).toDate();
      return dateValue instanceof Date ? dateValue : undefined;
    }

    if (typeof value === "object" && value !== null) {
      const timestamp = value as {
        seconds?: number;
        nanoseconds?: number;
        _seconds?: number;
        _nanoseconds?: number;
      };

      const seconds =
        typeof timestamp.seconds === "number"
          ? timestamp.seconds
          : typeof timestamp._seconds === "number"
            ? timestamp._seconds
            : undefined;

      if (typeof seconds === "number") {
        return new Date(seconds * 1000);
      }
    }

    return undefined;
  }
}
