import { Categories } from "@/domain/entities/categories/Categories";
import { IBaseRepository } from "../IBaseRepository";

export interface ICategoriesRepository extends IBaseRepository<Categories> {
    findActive(): Promise<Categories[]>;

}