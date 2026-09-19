import type { SocialLinkEntry, UserParticipation, UserPlan } from "@/domain/entities/user/User";

export interface PublicProfileViewModel {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  photoURL?: string;
  participation: UserParticipation;
  plan: UserPlan;
  creatorVerified: boolean;
  memberSince: string;
  isPublic: boolean;
  website?: string;
  socialLinks?: SocialLinkEntry[];
  isUsernameCustomized?: boolean;
  bannerUrl?: string;
}
