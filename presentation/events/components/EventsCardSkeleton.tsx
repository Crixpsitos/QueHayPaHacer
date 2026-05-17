export function EventsCardSkeleton() {
  return (
    <div className="flex flex-wrap gap-6 w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-row max-w-lg rounded-4xl overflow-hidden bg-card border border-foreground/5 animate-pulse"
        >
          {/* Imagen skeleton */}
          <div className="relative shrink-0 w-48 h-32 bg-zinc-200 dark:bg-zinc-800" />

          {/* Contenido skeleton */}
          <div className="flex flex-col flex-1 min-w-0 p-4 gap-3">
            {/* Autor + precio */}
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>

            {/* Título */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>

            {/* Footer con botones */}
            <div className="flex items-center gap-2 mt-auto pt-2">
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
