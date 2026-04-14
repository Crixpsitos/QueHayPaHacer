import type { Timestamp } from "firebase-admin/firestore";
import type { UserAccountType } from "@/domain/entities/user/UserAccountType";

export interface FirebaseUserDto {
    uid: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    acceptedTerms: boolean;
    accountType: UserAccountType;
    acceptedTermsAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
