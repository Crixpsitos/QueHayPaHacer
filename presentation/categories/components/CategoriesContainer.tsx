import Link from "@/app/components/ui/navigation/IntentLink";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";
import { CategoryViewModelMapper } from "../mapper/CategoryViewModelMapper";

const fetchActiveCategories = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("active-categories");

  const { categoriesService } = createServerContainer();
  const categories = await categoriesService.getActiveCategories();
  return categories.map(CategoryViewModelMapper.toViewModel);
};

/** «Por gusto»: las categorías como botones planos (sin iconos ni descripciones: en 360 px la descripción se cortaba). */
export const CategoriesContainer = async () => {
  const categories = await fetchActiveCategories();
  if (!categories.length) return null;

  return (
    <section aria-labelledby="por-gusto">
      <h2 id="por-gusto" className="mb-3 font-heading text-2xl font-bold sm:text-3xl">Por gusto</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
        {categories.slice(0, 10).map((c) => (
          <li key={c.id}>
            <Link href={c.href} className="flex min-h-13 items-center rounded-2xl border border-border bg-card px-3.5 text-[0.9375rem] font-semibold outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
