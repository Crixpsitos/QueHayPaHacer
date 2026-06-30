import { cn } from "@/app/lib/utils/cn";

interface EventStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  published: {
    label: "Publicado",
    className: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  draft: {
    label: "Borrador",
    className: "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-red-300 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300",
  },
  ended: {
    label: "Finalizado",
    className: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300",
  },
};

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const key = status.toLowerCase();
  const config = STATUS_MAP[key] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
