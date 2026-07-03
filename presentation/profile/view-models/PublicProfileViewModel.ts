import type { ProfessionalType, ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";

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
  professionalDetails?: ProfessionalRequestDetails;
}
