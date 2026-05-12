"use client"

import { createContext, useContext } from "react";
import { UserInfo } from "firebase/auth";
import { Claims } from "next-firebase-auth-edge/auth/claims";
import { Dispatch, SetStateAction } from "react";
 
export interface User extends UserInfo {
  emailVerified: boolean;
  customClaims: Claims;
  profile?: {
    firstName: string;
    lastName: string;
    username: string;
    phoneNumber: string;
    accountType: string | null;
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