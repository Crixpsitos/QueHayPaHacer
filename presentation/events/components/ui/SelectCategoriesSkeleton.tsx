"use client";

import { ChevronDown } from "lucide-react";

export const SelectCategoriesSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Esqueleto del FieldLabel (Simula el texto "Estado") */}
      <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />

      {/* Esqueleto del SelectTrigger */}
      <div className="flex h-10 w-full animate-pulse items-center justify-between rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 shadow-sm">
        {/* Simulación del texto Placeholder */}
        <div className="h-4 w-36 rounded bg-gray-200" />
        
        {/* Icono del chevron de Radix en gris para mantener la estética */}
        <ChevronDown className="h-4 w-4 text-gray-300" />
      </div>
    </div>
  );
};