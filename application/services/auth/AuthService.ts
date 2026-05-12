import type { UserCredential } from "firebase/auth";
import type { IAuthRepository } from "@/domain/repository/auth/IAuthRepository";

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async login(email: string, password: string): Promise<UserCredential> {
    return this.authRepository.loginWithEmailAndPassword(email, password);
  }

  async register(email: string, password: string): Promise<UserCredential> {
    return this.authRepository.registerWithEmailAndPassword(email, password);
  }

  async logout(): Promise<void> {
    return this.authRepository.logout();
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    return this.authRepository.sendPasswordResetEmail(email);
  }

  onAuthStateChanged(callback: (user: UserCredential | null) => void): () => void {
    return this.authRepository.onAuthStateChanged(callback);
  }
}
