import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";

export class AuthFirebaseRepository {

    constructor(
        private readonly auth: ReturnType<typeof getFirebaseAuth>
    ) {}

    async getCurrentUser() {
        
    }
}