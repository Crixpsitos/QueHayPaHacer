export interface ProfileStats {
  eventsCount: number;
  sitesCount: number;
  badgesCount: number;
}

export interface UserEvent {
  id: string;
  title: string;
  description: string;
  category?: {
    id?: string;
    title: string;
    slug?: string;
  };
  author?: {
    id: string;
    displayName: string;
    photoURL?: string;
    creatorVerified?: boolean;
  };
  status: string;
  moderationStatus: "pending" | "approved" | "rejected" | "pending_audit";
  moderationMode: "pre_publication" | "post_publication";
  rejectionReason?: string | null;
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
    category?: {
      id?: string;
      title: string;
      slug?: string;
    };
    author?: {
      id: string;
      displayName: string;
      photoURL?: string;
      creatorVerified?: boolean;
    };
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
  getUserEvents(uid: string, limit?: number): Promise<UserEvent[]>;
  getUserSites(uid: string, limit?: number): Promise<UserSite[]>;
  getUserEventInteractions(uid: string, limit?: number): Promise<UserEventInteraction[]>;
  getUserBadges(uid: string, limit?: number): Promise<UserBadge[]>;
}
