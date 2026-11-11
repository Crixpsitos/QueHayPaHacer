const STEPS = [
  { title: "Toca «Unirme»", text: "Reserva tu cupo con tu cuenta." },
  { title: "Te avisamos", text: "Un aviso la víspera y cuando queda el último cupo." },
  { title: "Llega y cuéntanos", text: "Marca «Yo fui» y deja tu reseña." },
] as const

/** Relleno de la plataforma: solo se muestra cuando a la ficha le falta contenido (ver `isSparse`). */
export function HowItWorks({ joinEnabled }: { joinEnabled: boolean }) {
  const steps = joinEnabled ? STEPS : [{ title: "Guárdala", text: "Toca el marcador y te avisamos cuando se acerque." }, STEPS[1], STEPS[2]]
  return (
    <section aria-labelledby="como" className="grid gap-4">
      <h2 id="como" className="font-heading text-2xl font-extrabold tracking-tight">Cómo funciona</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-light font-heading text-sm font-bold text-primary-dark">{i + 1}</span>
            <span className="grid gap-0.5 leading-snug"><span className="font-semibold">{s.title}</span><span className="text-sm text-muted-foreground">{s.text}</span></span>
          </li>
        ))}
      </ol>
    </section>
  )
}
