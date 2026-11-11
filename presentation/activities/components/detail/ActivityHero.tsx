import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Images } from "lucide-react"
import type { ActivityPublicView } from "@/presentation/activities/lib/publicView"
import { ShareButton } from "./ShareButton"

/** Escritorio: la distribución depende de cuántas fotos hay (con 1 o 2 no quedan huecos). */
function DesktopMosaic({ gallery }: { gallery: ActivityPublicView["gallery"] }) {
  const shown = gallery.slice(0, 5)
  const layout = shown.length === 1 ? "grid-cols-1" : shown.length === 2 ? "grid-cols-3" : "grid-cols-4 grid-rows-2"
  const big = (i: number) => (i === 0 ? (shown.length === 2 ? "col-span-2" : shown.length >= 3 ? "col-span-2 row-span-2" : "") : "")
  return (
    <div className={`hidden h-112 gap-2 overflow-hidden rounded-[2rem] sm:grid ${layout}`} aria-label="Fotos de la actividad">
      {shown.map((g, i) => (
        <div key={g.url} className={`relative overflow-hidden bg-muted ${big(i)}`}>
          <Image src={g.url} alt={g.alt} fill sizes={i === 0 ? "60vw" : "25vw"} priority={i === 0} className="object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none" />
        </div>
      ))}
    </div>
  )
}

const glass = "grid size-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md outline-none transition-colors hover:bg-black/55 focus-visible:ring-3 focus-visible:ring-white/70"

/**
 * Portada a pantalla completa. Móvil: fotos a sangre que se deslizan (scroll-snap, sin JS) con atrás y compartir flotando.
 * Escritorio: portada grande y hasta 4 fotos más. El título entra como una hoja que sube sobre la foto (ver ActivityDetail).
 */
export function ActivityHero({ view, title }: { view: ActivityPublicView; title: string }) {
  const { gallery, video } = view
  return (
    <div className="relative -mx-4 sm:mx-0">
      {gallery.length ? (
        <>
          <ul className="flex aspect-4/5 snap-x snap-mandatory overflow-x-auto sm:hidden" aria-label="Fotos de la actividad">
            {gallery.map((g, i) => (
              <li key={g.url} className="relative h-full w-full shrink-0 snap-center bg-muted">
                <Image src={g.url} alt={g.alt} fill sizes="100vw" priority={i === 0} className="object-cover" />
              </li>
            ))}
          </ul>
          <DesktopMosaic gallery={gallery} />
        </>
      ) : (
        <div className="grid aspect-4/5 place-items-center bg-muted text-sm text-muted-foreground sm:aspect-video sm:rounded-[2rem]">Sin fotos todavía</div>
      )}

      {/* degradado para que los controles se lean sobre cualquier foto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/45 to-transparent sm:hidden" aria-hidden />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between sm:hidden">
        <Link href="/actividades" aria-label="Volver a actividades" className={glass}><ArrowLeft className="size-5" aria-hidden /></Link>
        <ShareButton title={title} activityId={view.id} iconOnly className={glass} />
      </div>
      {gallery.length > 1 ? (
        <span className="absolute bottom-12 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:hidden"><Images className="size-3.5" aria-hidden /> {gallery.length} fotos · desliza</span>
      ) : null}
      {video ? (
        <video controls preload="none" poster={video.thumbnailUrl ?? undefined} className="mt-3 hidden aspect-video w-full rounded-3xl bg-black sm:block" aria-label="Video de la actividad">
          <source src={video.url} type="video/mp4" />
        </video>
      ) : null}
    </div>
  )
}
