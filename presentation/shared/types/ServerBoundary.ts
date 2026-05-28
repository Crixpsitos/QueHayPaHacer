import { ReactNode } from "react";

export interface ServerBoundaryProps<P, S> {
    params?: Promise<P>;
    searchParams?: Promise<S>;
    children: (data: { params: P; searchParams: S }) => ReactNode;
    fallback?: ReactNode;
}