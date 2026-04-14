import type { Firestore } from "firebase-admin/firestore";
import { User } from "@/domain/entities/user/User";
import { IUserRepository } from "@/domain/repository/IUserRepository";
import { FirebaseBaseRepository } from "@/infraestructure/repository/FirebaseBaseRepository";


export class FirebaseUserRepository extends FirebaseBaseRepository implements IUserRepository {
    protected readonly collectionName = "users";

    constructor(db: Firestore) {
        super(db);
    }

    findByEmail(email: string): Promise<User | null> {
        void email;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    findByUsername(username: string): Promise<User | null> {
        void username;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    findById(id: string): Promise<User | null> {
        void id;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    findAll(): Promise<User[]> {
        void this.collection;
        throw new Error("Method not implemented.");
    }
    create(item: User): Promise<User> {
        void item;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    update(id: string, item: User): Promise<User> {
        void id;
        void item;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    delete(id: string): Promise<void> {
        void id;
        void this.collection;
        throw new Error("Method not implemented.");
    }
    

    

}