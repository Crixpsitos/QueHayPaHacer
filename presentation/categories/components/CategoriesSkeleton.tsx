import { Section } from "@/app/components/layout/shared/Section";

export function CategoriesSkeleton() {
  return (
    <Section spacing="sm" className="mt-4">
      <div className="mb-4 h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#F4F4F5] bg-white p-4">
            <div className="size-14 animate-pulse rounded-full bg-muted sm:size-16" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </Section>
  );
}
