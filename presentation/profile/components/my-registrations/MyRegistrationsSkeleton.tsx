import { Skeleton } from "@/app/components/ui/skeleton";

export function MyRegistrationsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Cargando tus inscripciones">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}
