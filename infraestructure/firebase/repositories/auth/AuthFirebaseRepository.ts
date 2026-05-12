import type { IAuthRepository } from "@/domain/repository/auth/IAuthRepository";
import type { Auth, UserCredential } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

export class AuthFirebaseRepository implements IAuthRepository {
  constructor(private readonly auth: Auth) {}

  onAuthStateChanged(callback: (user: UserCredential | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      callback(user as UserCredential | null);
    });
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async registerWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
}
