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

  return <Comp className={cn("mx-auto w-full max-w-screen-2xl px-4 sm:px-6 md:px-8 lg:px-12", 
        className)} {...props} />;
}
