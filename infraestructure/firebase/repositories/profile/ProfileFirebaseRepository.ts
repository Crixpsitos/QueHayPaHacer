import type { Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type {
  ProfileStats,
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";

export class ProfileFirebaseRepository extends FirebaseBaseRepository {
  protected readonly collectionName = "users";

  constructor(db: Firestore, _enterpriseDb: unknown) {
    super(db);
    void _enterpriseDb;
  }

  async getStats(uid: string): Promise<ProfileStats> {
    const [
      eventsByAuthorId,
      eventsByAuthorUid,
      sitesByAuthorId,
      sitesByAuthorUid,
      badgesSnap,
    ] = await Promise.all([
      this.db.collection("events").where("author.id", "==", uid).count().get(),
      this.db.collection("events").where("author.uid", "==", uid).count().get(),
      this.db.collection("sites").where("author.id", "==", uid).count().get(),
      this.db.collection("sites").where("author.uid", "==", uid).count().get(),
      this.subCollection(uid, "badges").count().get(),
    ]);

    return {
      eventsCount: Math.max(
        eventsByAuthorId.data().count,
        eventsByAuthorUid.data().count,
      ),
      sitesCount: Math.max(
        sitesByAuthorId.data().count,
        sitesByAuthorUid.data().count,
      ),
      badgesCount: badgesSnap.data().count,
    };
  }

  async getUserEvents(uid: string): Promise<UserEvent[]> {
    const byAuthorId = await this.getEventsByAuthorPath("author.id", uid);
    const byAuthorUid = byAuthorId.length
      ? []
      : await this.getEventsByAuthorPath("author.uid", uid);

    return [...byAuthorId, ...byAuthorUid].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getUserSites(uid: string): Promise<UserSite[]> {
    const byAuthorId = await this.getSitesByAuthorPath("author.id", uid);
    const byAuthorUid = byAuthorId.length
      ? []
      : await this.getSitesByAuthorPath("author.uid", uid);

    return [...byAuthorId, ...byAuthorUid].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getUserEventInteractions(uid: string): Promise<UserEventInteraction[]> {
    const interactionsCollection = this.subCollection(uid, "eventInteractions");

    let interactionsSnapshot;
    try {
      interactionsSnapshot = await interactionsCollection.orderBy("createdAt", "desc").get();
    } catch {
      interactionsSnapshot = await interactionsCollection.get();
    }

    const interactionsBase = interactionsSnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const rawType = data.type;
      const interactionType: "like" | "comment" | "share" =
        rawType === "comment" || rawType === "share" ? rawType : "like";

      return {
        id: doc.id,
        eventId: typeof data.eventId === "string" ? data.eventId : "",
        type: interactionType,
        createdAt: this.toDate(data.createdAt),
      };
    });

    const uniqueEventIds = Array.from(
      new Set(interactionsBase.map((interaction) => interaction.eventId).filter(Boolean)),
    );

    const eventEntries = await Promise.all(
      uniqueEventIds.map(async (eventId) => {
        const eventDoc = await this.db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
          return [eventId, undefined] as const;
        }

        const eventData = eventDoc.data() as Record<string, unknown>;
        return [eventId, this.mapEventPreview(eventData)] as const;
      }),
    );

    const eventsById = new Map(eventEntries);

    return interactionsBase.map((interaction) => ({
      ...interaction,
      event: eventsById.get(interaction.eventId),
    }));
  }

  private mapEventPreview(eventObj: Record<string, unknown>) {
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
        city: typeof locationObj?.city === "string" ? locationObj.city : undefined,
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

  async getUserBadges(uid: string): Promise<UserBadge[]> {
    const snapshot = await this.subCollection(uid, "badges")
      .orderBy("earnedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        category: data.category ?? "system",
        earnedAt: this.toDate(data.earnedAt),
      };
    });
  }

  private async getEventsByAuthorPath(
    path: "author.id" | "author.uid",
    uid: string,
  ): Promise<UserEvent[]> {
    const withOrderQuery = this.db
      .collection("events")
      .where(path, "==", uid)
      .orderBy("createdAt", "desc");
    const noOrderQuery = this.db.collection("events").where(path, "==", uid);

    let snapshot;
    try {
      snapshot = await withOrderQuery.get();
    } catch {
      snapshot = await noOrderQuery.get();
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
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
          city: typeof data.location?.city === "string" ? data.location.city : undefined,
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
    });
  }

  private async getSitesByAuthorPath(
    path: "author.id" | "author.uid",
    uid: string,
  ): Promise<UserSite[]> {
    const withOrderQuery = this.db
      .collection("sites")
      .where(path, "==", uid)
      .orderBy("createdAt", "desc");
    const noOrderQuery = this.db.collection("sites").where(path, "==", uid);

    let snapshot;
    try {
      snapshot = await withOrderQuery.get();
    } catch {
      snapshot = await noOrderQuery.get();
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      // Portada: item de media con isCover; la dirección vive en location.address
      const media = Array.isArray(data.media)
        ? (data.media as Array<Record<string, unknown>>)
        : [];
      const cover =
        media.find((m) => m.type === "image" && m.isCover === true) ??
        media.find((m) => m.type === "image");
      const coverUrl = typeof cover?.url === "string" ? cover.url : undefined;

      const location = data.location as { address?: string } | undefined;
      const analytics = data.analytics as
        | { clicks?: number; likes?: number; shares?: number; eventCount?: number }
        | undefined;

      return {
        id: doc.id,
        name: data.name ?? "Sitio sin nombre",
        address: location?.address ?? data.address ?? "Sin dirección",
        createdAt: this.toDate(data.createdAt),
        image: coverUrl ?? (typeof data.image === "string" ? data.image : undefined),
        analytics: {
          clicks: analytics?.clicks ?? 0,
          likes: analytics?.likes ?? 0,
          shares: analytics?.shares ?? 0,
          eventCount: analytics?.eventCount ?? 0,
        },
      };
    });
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
