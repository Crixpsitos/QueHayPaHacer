import { Categories } from "@/domain/entities/categories/Categories";
import { FirebaseCategoriesDto } from "../../dto/categories/FirebaseCategoriesDto";

export interface ICategoriesMapper {
  toDomain(dto: FirebaseCategoriesDto): Categories;
  toDto(domain: Categories): FirebaseCategoriesDto;
}