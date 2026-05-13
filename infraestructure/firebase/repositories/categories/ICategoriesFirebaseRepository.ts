import { FirebaseCategoriesDto } from "../../dto/categories/FirebaseCategoriesDto";

export interface ICategoriesFirebaseRepository {
    findActive(): Promise<FirebaseCategoriesDto[]>;
}