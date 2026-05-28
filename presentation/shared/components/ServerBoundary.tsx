import { Suspense } from "react";
import { ServerBoundaryProps } from "../types/ServerBoundary";
import { DataLoader } from "./DataLoader";

export const ServerBoundary = async <T = unknown, S = unknown>({
  children,
  fallback,
  params,
  searchParams,
}: ServerBoundaryProps<T, S>) => {
  return (
    <Suspense fallback={fallback}>
      <DataLoader params={params} searchParams={searchParams}>
        {children}
      </DataLoader>
    </Suspense>
  );
};
