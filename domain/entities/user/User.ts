import type{ UserAccountType } from "./UserAccountType";

export interface User {
    uid: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    acceptedTerms: boolean;
    accountType: UserAccountType;
    acceptedTermsAt: Date;
    createdAt: Date;
    updatedAt: Date;
}