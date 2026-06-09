import { ServerBoundaryProps } from "../types/ServerBoundary";

export async function DataLoader<P, S>({
  params,
  searchParams,
  children,
}: Omit<ServerBoundaryProps<P, S>, "fallback">) {
  const resolvedParams = params ? await params : ({} as P);
  const resolvedSearchParams = searchParams ? await searchParams : ({} as S);

  return <>{children({ params: resolvedParams, searchParams: resolvedSearchParams })}</>;
}
