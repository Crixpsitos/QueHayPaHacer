"use client"

import { createContext, useContext } from "react";
import { UserInfo } from "firebase/auth";
import { Claims } from "next-firebase-auth-edge/auth/claims";
import { Dispatch, SetStateAction } from "react";
import type { ProfessionalRequestDetails } from "@/domain/entities/professional/ProfessionalRequest";
import type { SocialLinkEntry } from "@/domain/entities/user/User";

export interface User extends UserInfo {
  emailVerified: boolean;
  customClaims: Claims;
  profile?: {
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    accountType: string | null;
    professionalType: string | null;
    professionalStatus: string | null;
    bio: string | null;
    photoURL?: string | null;
    imagePath?: string | null;
    isPublic: boolean;
    brandName?: string;
    website?: string;
    mapsLink?: string;
    socialLink?: string;
    socialLinks?: SocialLinkEntry[];
    isUsernameCustomized?: boolean;
    professionalDescription?: string;
    professionalDetails?: ProfessionalRequestDetails;
    bannerUrl?: string | null;
    bannerPath?: string | null;
  } | null;
}
 
export interface AuthContextValue {
  user: User | null;
  isHydrating: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}
 
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isHydrating: true,
  setUser: () => undefined,
  refreshUser: async () => undefined,
});
 
export const useAuth = () => useContext(AuthContext);