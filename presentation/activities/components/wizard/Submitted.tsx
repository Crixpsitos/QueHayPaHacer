"use client"

import Link from "next/link"
import { CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"

/** Pantalla final: en revisión (cuenta nueva) o publicada (cuenta de confianza / QHPA). */
export function Submitted({ title, slug, moderationStatus }: { title: string; slug: string; moderationStatus: "pending" | "approved" | "rejected" }) {
  const live = moderationStatus === "approved"
  return (
    <div className="mx-auto grid w-full max-w-xl gap-6 py-10 text-center" role="status">
      <div className={`mx-auto grid size-[4.5rem] place-items-center rounded-full ${live ? "bg-[#E4F5E8] text-[#14532D]" : "bg-accent text-[#7a5200]"}`}>
        {live ? <CheckCircle2 className="size-9" aria-hidden /> : <Clock className="size-9" aria-hidden />}
      </div>
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{live ? "Tu actividad ya está publicada" : "Tu actividad está en revisión"}</h1>
        <p className="text-muted-foreground">
          {live ? `"${title}" ya aparece en Qué Hay Pa Hacer.` : "La revisamos y te avisamos por la campanita cuando salga publicada. Mientras tanto solo la ves tú."}
        </p>
      </div>
      <ul className="mx-auto grid gap-2 text-left text-sm">
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#14532D]" aria-hidden />Tus datos de identificación quedaron guardados en privado.</li>
        {live ? null : <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#14532D]" aria-hidden />Cuando tengas 3 actividades aprobadas, las siguientes se publican al instante.</li>}
      </ul>
      <div className="grid gap-3">
        {live ? <Button asChild size="lg" className="h-12 text-base"><Link href={`/actividades/${slug}`}>Ver mi actividad</Link></Button> : null}
        <Button asChild variant={live ? "outline" : "default"} size="lg" className="h-12 text-base"><Link href="/actividades/mis">Ir a mis actividades</Link></Button>
      </div>
    </div>
  )
}
