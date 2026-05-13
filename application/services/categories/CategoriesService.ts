import { Categories } from "@/domain/entities/categories/Categories";
import { ICategoriesRepository } from "@/domain/repository/categories/ICategoriesRepository";

export class CategoriesService {
    constructor(private readonly categoriesRepository: ICategoriesRepository) {}

    async getActiveCategories(): Promise<Categories[]> {
        return this.categoriesRepository.findActive();
    }
}