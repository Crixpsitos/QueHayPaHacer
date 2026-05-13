import { Firestore } from "firebase-admin/firestore";
import { FirebaseCategoriesDto } from "../../dto/categories/FirebaseCategoriesDto";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { ICategoriesFirebaseRepository } from "./ICategoriesFirebaseRepository";

export class CategoriesFirebaseRepository extends FirebaseBaseRepository implements ICategoriesFirebaseRepository {
    protected collectionName = "categories";

    constructor(db: Firestore) {
        super(db);
    }

    async findActive(): Promise<FirebaseCategoriesDto[]> {
        
        const snapshot = await this.collection
            .where("isActive", "==", true)
            .orderBy("createdAt", "desc")
            .get();

        return snapshot.docs.map(doc => doc.data() as FirebaseCategoriesDto);
    }

}