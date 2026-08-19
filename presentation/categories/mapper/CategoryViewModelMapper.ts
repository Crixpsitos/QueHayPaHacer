import type { Categories } from "@/domain/entities/categories/Categories";
import type { CategoryViewModel } from "../view-models/CategoryViewModel";

export class CategoryViewModelMapper {
  static toViewModel(category: Categories): CategoryViewModel {
    return {
      id: category.id,
      slug: category.slug,
      title: category.title,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      href: `/eventos-${category.slug}-ibague`,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
