import { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/lib/utils/cn";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Comp = as ?? "div";

  return <Comp className={cn("w-full px-2 sm:px-3", className)} {...props} />;
}
