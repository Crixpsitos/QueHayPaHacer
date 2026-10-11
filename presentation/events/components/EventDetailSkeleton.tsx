/** Mismo esqueleto que `EventDetailClient`: hero 21:9, intro + boleta lateral, cuerpo. */
const bar = "rounded-md bg-[#F4F4F5]";

export const EventDetailSkeleton = () => (
  <div className="mx-auto max-w-7xl animate-pulse px-4 pt-4 pb-14 sm:px-6 sm:pt-8 lg:px-8" aria-busy="true" aria-label="Cargando evento">
    <div className="aspect-4/3 w-full rounded-3xl bg-[#F4F4F5] sm:aspect-21/9" />

    <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-12">
      <div className="space-y-4 lg:col-span-8">
        <div className={`${bar} h-10 w-3/4`} />
        <div className={`${bar} h-5 w-1/2`} />
        <div className="space-y-2 pt-6">
          <div className={`${bar} h-4`} />
          <div className={`${bar} h-4 w-11/12`} />
          <div className={`${bar} h-4 w-4/6`} />
        </div>
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="overflow-hidden rounded-3xl border border-[#E4E4E7]">
          <div className="h-40 bg-[#09090B]/10" />
          <div className="space-y-3 p-5">
            <div className={`${bar} h-8 w-1/2`} />
            <div className="h-11 rounded-full bg-[#F4F4F5]" />
          </div>
        </div>
      </aside>
    </div>
  </div>
);
