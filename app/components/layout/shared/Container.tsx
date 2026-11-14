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

  // Como el prototipo: 24 px a cada lado (16 px en celular). Tope de 1536 px (screen-2xl) para monitores muy anchos.
  return <Comp className={cn("mx-auto w-full max-w-screen-2xl px-4 sm:px-6", 
        className)} {...props} />;
}
