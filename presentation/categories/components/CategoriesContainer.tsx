import { Section } from "@/app/components/layout/shared/Section";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { CategoryViewModelMapper } from "../mapper/CategoryViewModelMapper";
import { CategoryItem } from "./CategoryItem";

const fetchActiveCategories = async () => {
  "use cache";
  cacheLife({
    stale: 300,
    revalidate: 120,
    expire: 600,
  });
  cacheTag("active-categories");

  const { categoriesService } = createServerContainer();
  const categories = await categoriesService.getActiveCategories();
  return categories.map(CategoryViewModelMapper.toViewModel);
};

export const CategoriesContainer = async () => {
  const categories = await fetchActiveCategories();

  return (
    <Section spacing="sm" className="mt-4">
      <h2 className="text-2xl font-bold mb-4">Explorar las categorías</h2>
      <div className="flex flex-wrap gap-6">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
    </Section>
  );
};

