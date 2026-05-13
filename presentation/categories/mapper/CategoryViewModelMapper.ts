import type { Categories } from "@/domain/entities/categories/Categories";
import type { CategoryViewModel } from "../view-models/CategoryViewModel";

export class CategoryViewModelMapper {
  static toViewModel(category: Categories): CategoryViewModel {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(category.navigation.filters)) {
      params.set(key, String(value));
    }

    if (category.navigation.sort) {
      params.set("sortField", category.navigation.sort.field);
      params.set("sortOrder", category.navigation.sort.order);
    }

    const search = params.toString();
    const href = search
      ? `${category.navigation.resource}?${search}`
      : category.navigation.resource;

    return {
      id: category.id,
      title: category.title,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive,
      href,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
