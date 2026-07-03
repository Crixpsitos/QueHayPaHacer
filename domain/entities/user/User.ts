import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import type { ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";

export type UserAccountType = "personal" | "professional";

export type UserProfessionalStatus = "none" | "pending" | "approved" | "rejected";

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
    accountType: UserAccountType;
    professionalType: ProfessionalType | null;
    professionalStatus: UserProfessionalStatus;
    professionalDetails?: ProfessionalRequestDetails;
    brandName?: string;
    website?: string;
    mapsLink?: string;
    socialLink?: string;
    isPublic: boolean;
    acceptedTermsAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
