"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface EventsLimitSelectProps {
  limit: number;
  options: number[];
}

export function EventsLimitSelect({ limit, options }: EventsLimitSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", value);
    // Cambiar el límite invalida la posición del cursor: volvemos a la primera página.
    params.delete("cursor");
    params.delete("direction");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      Mostrar
      <select
        value={limit}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-indigo-400"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
