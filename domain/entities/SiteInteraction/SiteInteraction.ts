export interface SiteInteraction {
  id: string;
  siteId: string;
  userId: string;
  liked: boolean;
  likedAt?: Date;
  shareCount: number;
  lastSharedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
