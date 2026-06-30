/** Skeleton del layout del Studio mientras se resuelven cookies/tokens. */
export function StudioShellFallback() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 sm:px-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="flex flex-1">
        <div className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50/60 p-3 lg:block">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
        <main className="min-w-0 flex-1 bg-gray-50/40">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
            <div className="h-8 w-72 animate-pulse rounded bg-gray-100" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
            <div className="mt-6 h-80 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </main>
      </div>
    </div>
  );
}
