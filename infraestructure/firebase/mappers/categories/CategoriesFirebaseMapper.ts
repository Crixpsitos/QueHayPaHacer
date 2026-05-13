import { Timestamp } from "firebase-admin/firestore";
import type { Categories } from "@/domain/entities/categories/Categories";
import type { FirebaseCategoriesDto } from "@/infraestructure/firebase/dto/categories/FirebaseCategoriesDto";
import { ICategoriesMapper } from "./ICategoriesMapper";

export class CategoriesFirebaseMapper implements ICategoriesMapper {
    toDomain(dto: FirebaseCategoriesDto): Categories {
        return {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            icon: dto.icon,
            isActive: dto.isActive,
            navigation: dto.navigation,
            createdAt: dto.createdAt.toDate(),
            updatedAt: dto.updatedAt.toDate(),
        };
    }
    toDto(domain: Categories): FirebaseCategoriesDto {
        return {
            id: domain.id,
            title: domain.title,
            description: domain.description,
            icon: domain.icon,
            isActive: domain.isActive,
            navigation: domain.navigation,
            createdAt: Timestamp.fromDate(domain.createdAt),
            updatedAt: Timestamp.fromDate(domain.updatedAt),
        };
    }
    
}