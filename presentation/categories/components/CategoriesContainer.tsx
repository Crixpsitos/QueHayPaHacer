import { Section } from "@/app/components/layout/shared/Section";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { CategoryViewModelMapper } from "../mapper/CategoryViewModelMapper";
import { CategoryItem } from "./CategoryItem";

const fetchActiveCategories = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("active-categories");

  const { categoriesService } = createServerContainer();
  const categories = await categoriesService.getActiveCategories();
  return categories.map(CategoryViewModelMapper.toViewModel);
};

export const CategoriesContainer = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("active-categories");
  const categories = await fetchActiveCategories();

  return (
    <Section spacing="sm" className="mt-4">
      <h2 className="mb-4 text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Explorar las categorías</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
    </Section>
  );
};

