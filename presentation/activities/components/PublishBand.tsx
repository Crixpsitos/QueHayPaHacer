import Link from "next/link"

/** Invitación a publicar: cierre de la ficha y del hub. Vinotinto de marca con el dorado como acento. */
export function PublishBand({ title = "¿Organizas algo en Ibagué?", text = "Publica tu actividad gratis. Se repite sola cada semana y la gente reserva su cupo." }: { title?: string; text?: string }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-primary-dark p-7 text-white sm:p-10">
      <span className="absolute -right-12 -top-12 -z-10 size-44 rounded-full bg-[#FFB703]" aria-hidden />
      <span className="absolute -bottom-16 -left-10 -z-10 size-40 rounded-full bg-[#6E0A1D]" aria-hidden />
      <h2 className="max-w-xs font-heading text-3xl font-extrabold leading-[1.05] tracking-tight sm:max-w-md sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-white/90">{text}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/actividades/crear" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 text-base font-semibold text-foreground outline-none transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-white/70 motion-reduce:transition-none">Publicar mi actividad</Link>
        <Link href="/contactanos" className="inline-flex min-h-12 items-center px-2 text-base font-semibold underline underline-offset-4">Tengo dudas</Link>
      </div>
    </section>
  )
}
