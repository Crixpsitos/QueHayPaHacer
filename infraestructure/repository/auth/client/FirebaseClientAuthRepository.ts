import { IAuthRepository } from "@/domain/repository/Auth/IAuthRepository";
import type { Auth, UserCredential } from "firebase/auth";
import { onAuthStateChanged, signInWithEmailAndPassword , signOut } from "firebase/auth";

export class FirebaseClientAuthRepository implements IAuthRepository {

    constructor(private auth: Auth) {}


    onAuthStateChanged(callback: (user: UserCredential | null) => void): () => void {
        return onAuthStateChanged(this.auth, (user) => {
            callback(user as UserCredential | null);
        });
    }

    logout(): Promise<void> {
        return signOut(this.auth);
    }
    sendPasswordResetEmail(email: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }
}