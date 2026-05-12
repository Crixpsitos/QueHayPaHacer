import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/lib/utils/cn";

export function PageContent({ className, ...props }: ComponentPropsWithoutRef<"main">) {
  return <main className={cn("flex flex-1 flex-col", className)} {...props} />;
}
