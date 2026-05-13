import { Section } from "@/app/components/layout/shared/Section";

export function CategoriesSkeleton() {
  return (
    <Section spacing="sm" className="mt-4">
      <div className="h-8 w-56 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
      <div className="flex flex-wrap gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 w-20 sm:w-24 md:w-28">
            <div className="size-16 sm:size-20 md:size-24 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-3 w-14 sm:h-4 sm:w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </Section>
  );
}
