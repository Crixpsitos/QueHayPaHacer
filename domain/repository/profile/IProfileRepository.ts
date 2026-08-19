export interface ProfileStats {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
}

export interface UserEvent {
  id: string;
  title: string;
  description: string;
  status: string;
  eventType?: "standard" | "multi-date";
  registrationType?: "none" | "internal" | "external" | "form";
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  image?: string;
  isFree?: boolean;
  priceAmount?: number;
  priceCurrency?: string;
  capacity?: number;
  location?: {
    venue?: string;
    city?: string;
    department?: string;
    country?: string;
  };
  analytics?: {
    views?: number;
    clicks?: number;
    likes?: number;
    shares?: number;
    registrations?: number;
  };
}

export interface UserSite {
  id: string;
  slug: string;
  name: string;
  address: string;
  category: string;
  createdAt: Date;
  coverUrl?: string;
  publicationStatus: "draft" | "published";
  moderationStatus: "pending" | "approved" | "rejected";
  analytics: {
    views: number;
    likes: number;
    eventCount: number;
  };
}

export interface UserEventInteraction {
  id: string;
  eventId: string;
  type: "like" | "comment" | "share";
  createdAt: Date;
  event?: {
    title: string;
    image?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    isFree?: boolean;
    priceAmount?: number;
    priceCurrency?: string;
    location?: {
      venue?: string;
      city?: string;
      department?: string;
      country?: string;
    };
    analytics?: {
      likes?: number;
      views?: number;
      registrations?: number;
    };
  };
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category: "system" | "achievement" | "milestone";
  earnedAt: Date;
}

export interface IProfileRepository {
  getStats(uid: string): Promise<ProfileStats>;
  getUserEvents(uid: string): Promise<UserEvent[]>;
  getUserSites(uid: string): Promise<UserSite[]>;
  getUserEventInteractions(uid: string): Promise<UserEventInteraction[]>;
  getUserBadges(uid: string): Promise<UserBadge[]>;
}
