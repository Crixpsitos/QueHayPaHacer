import { cn } from "@/app/lib/utils/cn";

const GROUP = 4;

/** Puntos verticales del banner, en grupos de 4. `progressive` (escritorio) escala por distancia al activo. */
export function CampaignDots({
  ids,
  current,
  total,
  onSelect,
  progressive,
  className,
}: {
  ids: string[];
  current: number;
  total: number;
  onSelect: (index: number) => void;
  progressive?: boolean;
  className?: string;
}) {
  const start = Math.floor(current / GROUP) * GROUP;
  const size = (i: number) => {
    if (!progressive) return current === i ? "h-5 w-2" : "h-2 w-2 opacity-60";
    if (total <= 1) return "h-2 w-2";
    const d = Math.min(Math.abs(current - i), total - Math.abs(current - i));
    return ["h-5 w-2.5", "h-3.5 w-2 opacity-80", "h-2.5 w-2 opacity-55"][d] ?? "h-2 w-2 opacity-35";
  };

  return (
    <div className={className}>
      {ids.slice(start, start + GROUP).map((id, o) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(start + o)}
          aria-label={`Ir al slide ${start + o + 1}`}
          aria-current={current === start + o}
          className={cn(
            "relative rounded-full bg-white transition-[height,opacity] duration-300 motion-reduce:transition-none after:absolute after:-inset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
            size(start + o),
          )}
        />
      ))}
    </div>
  );
}
