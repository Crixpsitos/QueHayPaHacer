import type { UserCredential } from "firebase/auth";

export interface IAuthRepository {
    loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential>;
    logout(): Promise<void>;
    sendPasswordResetEmail(email: string): Promise<void>;
    onAuthStateChanged(callback: (user: UserCredential | null) => void): () => void;
}