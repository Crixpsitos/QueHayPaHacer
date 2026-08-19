import { Loader2 } from "lucide-react";
import { Container } from "@/app/components/layout/shared/Container";
import { PublicProfileContainer } from "@/presentation/profile/components/PublicProfileContainer";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";

interface PublicProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  return (
    <ServerBoundary params={params} fallback={<PublicProfileSkeleton />}>
      {({ params: { handle } }) => <PublicProfileContainer handle={handle} />}
    </ServerBoundary>
  );
}

function PublicProfileSkeleton() {
  return (
    <Container className="flex flex-1 flex-col gap-6 p-4">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-6 sm:gap-8">
              <div className="size-20 shrink-0 animate-pulse rounded-full bg-muted sm:size-32" />

              <div className="flex-1 space-y-4">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>

            <div className="flex items-center gap-8 border-t border-border pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="h-4 w-6 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-10 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Cargando perfil...</span>
      </div>
    </Container>
  );
}
