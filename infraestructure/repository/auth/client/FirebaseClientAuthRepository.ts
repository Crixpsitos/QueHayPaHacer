import { IAuthRepository } from "@/domain/repository/Auth/IAuthRepository";
import type { Auth, UserCredential } from "firebase/auth";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword , signOut } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";

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
    public sendPasswordResetEmail(email: string): Promise<void> {
        return sendPasswordResetEmail(this.auth, email);
    }
    async loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    async registerWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        return createUserWithEmailAndPassword(this.auth, email, password);  
    }
}