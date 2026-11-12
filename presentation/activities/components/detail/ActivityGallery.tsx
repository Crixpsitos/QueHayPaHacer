import Image from "next/image"
import type { ActivityPublicView } from "@/presentation/activities/lib/publicView"

/** Móvil: carrusel con desplazamiento (scroll-snap, sin JS). Escritorio: portada grande y hasta 4 más. */
export function ActivityGallery({ view }: { view: ActivityPublicView }) {
  const { gallery, video } = view
  if (!gallery.length) {
    return <div className="grid aspect-video place-items-center rounded-3xl bg-muted text-sm text-muted-foreground">Sin fotos todavía</div>
  }
  return (
    <div className="grid gap-3">
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-3xl sm:hidden" aria-label="Fotos de la actividad">
        {gallery.map((g, i) => (
          <li key={g.url} className="relative aspect-4/3 w-full shrink-0 snap-center overflow-hidden rounded-3xl bg-muted">
            <Image src={g.url} alt={g.alt} fill sizes="100vw" priority={i === 0} className="object-cover" />
          </li>
        ))}
      </ul>
      <div className="hidden h-96 grid-cols-4 grid-rows-2 gap-3 overflow-hidden rounded-3xl sm:grid" aria-label="Fotos de la actividad">
        {gallery.slice(0, 5).map((g, i) => (
          <div key={g.url} className={`relative overflow-hidden bg-muted ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            <Image src={g.url} alt={g.alt} fill sizes={i === 0 ? "50vw" : "25vw"} priority={i === 0} className="object-cover" />
          </div>
        ))}
      </div>
      {video ? (
        <video controls preload="none" poster={video.thumbnailUrl ?? undefined} className="aspect-video w-full rounded-3xl bg-black" aria-label="Video de la actividad">
          <source src={video.url} type="video/mp4" />
        </video>
      ) : null}
    </div>
  )
}
