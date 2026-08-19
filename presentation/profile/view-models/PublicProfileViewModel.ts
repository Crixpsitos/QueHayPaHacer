import type { ProfessionalType, ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";
import type { SocialLinkEntry } from "@/domain/entities/user/User";

export interface PublicProfileViewModel {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  photoURL?: string;
  professionalType: ProfessionalType | null;
  isProfessional: boolean;
  emailVerified: boolean;
  memberSince: string;
  isPublic: boolean;
  brandName?: string;
  website?: string;
  mapsLink?: string;
  socialLink?: string;
  socialLinks?: SocialLinkEntry[];
  isUsernameCustomized?: boolean;
  professionalDetails?: ProfessionalRequestDetails;
  bannerUrl?: string;
}
