export type UserParticipation = "consumer" | "creator";

export type UserPlan = "basic" | "premium";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "twitter"
  | "linkedin"
  | "other";

export interface SocialLinkEntry {
  platform: SocialPlatform;
  url: string;
}

export interface User {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
    firstName: string;
    lastName: string;
    bio?: string;
    phoneNumber: string;
    photoURL?: string;
    imagePath?: string;
    acceptedTerms: boolean;
    participation: UserParticipation;
    creatorVerified: boolean;
    plan: UserPlan;
    website?: string;
    socialLinks?: SocialLinkEntry[];
    isUsernameCustomized?: boolean;
    isPublic: boolean;
    acceptedTermsAt: Date;
    createdAt: Date;
    updatedAt: Date;
    bannerUrl?: string;
    bannerPath?: string;
}
