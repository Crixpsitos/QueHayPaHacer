import type { Firestore } from "firebase-admin/firestore";
import type { FirebaseUserDto } from "@/infraestructure/firebase/dto/FirebaseUserDto";
import { FirebaseBaseRepository } from "@/infraestructure/repository/FirebaseBaseRepository";
import type { IUserDAO } from "@/infraestructure/repository/user/IUserDAO";

export class FirebaseUserRepository extends FirebaseBaseRepository implements IUserDAO {
    protected readonly collectionName = "users";

    constructor(db: Firestore) {
        super(db);
    }

    async findById(id: string): Promise<FirebaseUserDto | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;
        return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
    }

    async findAll(): Promise<FirebaseUserDto[]> {
        const snapshot = await this.collection.get();
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as FirebaseUserDto));
    }

    async findByEmail(email: string): Promise<FirebaseUserDto | null> {
        const snapshot = await this.collection.where("email", "==", email).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
    }

    async findByUsername(username: string): Promise<FirebaseUserDto | null> {
        const snapshot = await this.collection.where("displayName", "==", username).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
    }

    async create(dto: FirebaseUserDto): Promise<FirebaseUserDto> {
        await this.collection.doc(dto.uid).set(dto);
        return dto;
    }

    async update(id: string, dto: Partial<FirebaseUserDto>): Promise<FirebaseUserDto> {
        await this.collection.doc(id).update(dto as { [key: string]: unknown });
        const updated = await this.findById(id);
        return updated!;
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }
}