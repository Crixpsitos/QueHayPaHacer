import type { ElementType, ReactNode } from "react";
import { cn } from "@/app/lib/utils/cn";
import { Container } from "./Container";

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  as?: ElementType;
  spacing?: "sm" | "md" | "lg" | "xl";
}

const spacingClasses: Record<NonNullable<SectionProps["spacing"]>, string> = {
  sm: "py-8 sm:py-10",
  md: "py-10 sm:py-14",
  lg: "py-14 sm:py-18 lg:py-24",
  xl: "py-20 sm:py-24 lg:py-32",
};

export function Section({
  children,
  className,
  containerClassName,
  as: Comp = "section",
  spacing = "lg",
}: SectionProps) {
  return (
    <Comp className={cn(spacingClasses[spacing], className)}>
      <Container className={containerClassName}>{children}</Container>
    </Comp>
  );
}
