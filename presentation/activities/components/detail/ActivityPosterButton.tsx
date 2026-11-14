"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { ShareKit } from "@/presentation/shared/components/ShareKit"

/** «Afiche para compartir» de esta actividad: foto, cuándo y dónde, y el QR a la ficha. La foto se pide por la ruta de imágenes de la web (mismo origen). */
export function ActivityPosterButton({ slug, title, when, where, coverUrl, placeLogoUrl, className }: { slug: string; title: string; when: string; where?: string; coverUrl?: string | null; placeLogoUrl?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const imageUrl = coverUrl ? `/_next/image?url=${encodeURIComponent(coverUrl)}&w=1200&q=75` : undefined
  return (
    <>
      <Button type="button" variant="outline" className={className ?? "h-11 w-full"} onClick={() => setOpen(true)}><ImageIcon aria-hidden /> Afiche para compartir</Button>
      {open ? <ShareKit open onClose={() => setOpen(false)} kind="activity" id={slug} title={title} when={when} where={where} imageUrl={imageUrl} placeLogoUrl={placeLogoUrl} heading="Comparte esta actividad" /> : null}
    </>
  )
}
