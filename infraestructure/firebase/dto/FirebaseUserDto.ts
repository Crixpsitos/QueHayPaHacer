import type { Timestamp } from "firebase-admin/firestore";
import type { SocialLinkEntry, UserAccountType, UserProfessionalStatus } from "@/domain/entities/user/User";
import type { ProfessionalType, ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";

export interface FirebaseUserDto {
    uid: string;
    email: string;
    emailVerified?: boolean;
    displayName: string;
    firstName: string;
    lastName: string;
    bio?: string;
    phoneNumber: string;
    photoURL?: string;
    imagePath?: string;
    acceptedTerms: boolean;
    accountType?: UserAccountType;
    professionalType?: ProfessionalType | null;
    professionalStatus?: UserProfessionalStatus;
    professionalDetails?: ProfessionalRequestDetails;
    professionalDescription?: string;
    brandName?: string;
    website?: string;
    mapsLink?: string;
    socialLink?: string;
    socialLinks?: SocialLinkEntry[];
    isUsernameCustomized?: boolean;
    isPublic?: boolean;
    bannerUrl?: string;
    bannerPath?: string;
    acceptedTermsAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
