import { Categories } from "@/domain/entities/categories/Categories";
import { ICategoriesRepository } from "@/domain/repository/categories/ICategoriesRepository";
import { ICategoriesMapper } from "@/infraestructure/firebase/mappers/categories/ICategoriesMapper";
import { ICategoriesFirebaseRepository } from "@/infraestructure/firebase/repositories/categories/ICategoriesFirebaseRepository";

export class CategoriesAdapter implements ICategoriesRepository{

    constructor(
        private readonly repository: ICategoriesFirebaseRepository,
        private readonly mapper: ICategoriesMapper
    ){}

    async findActive(): Promise<Categories[]> {
        const dtos = await this.repository.findActive();
        return dtos.map((dto) => this.mapper.toDomain(dto));
    }
    findById(id: string): Promise<Categories | null> {
        throw new Error("Method not implemented.");
    }
    findAll(): Promise<Categories[]> {
        throw new Error("Method not implemented.");
    }
    create(item: Categories): Promise<Categories> {
        throw new Error("Method not implemented.");
    }
    update(id: string, item: Categories): Promise<Categories> {
        throw new Error("Method not implemented.");
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}