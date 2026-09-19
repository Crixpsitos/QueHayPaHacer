import type { Timestamp } from "firebase-admin/firestore";
import type { SocialLinkEntry, UserParticipation, UserPlan } from "@/domain/entities/user/User";

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
    participation?: UserParticipation;
    creatorVerified?: boolean;
    plan?: UserPlan;
    website?: string;
    socialLinks?: SocialLinkEntry[];
    isUsernameCustomized?: boolean;
    isPublic?: boolean;
    bannerUrl?: string;
    bannerPath?: string;
    acceptedTermsAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
