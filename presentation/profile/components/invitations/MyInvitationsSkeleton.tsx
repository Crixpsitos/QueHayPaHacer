import { Skeleton } from "@/app/components/ui/skeleton";

export function MyInvitationsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando tus invitaciones">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}
