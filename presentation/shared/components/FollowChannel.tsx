import { MessageCircle } from "lucide-react"
import { fetchChannelUrl } from "@/presentation/shared/data/channel"

/** «Seguir el canal» de WhatsApp. El enlace sale de `appConfig/whatsapp-channel`; sin enlace válido no se muestra nada. */
export async function FollowChannel({ className }: { className?: string }) {
  const url = await fetchChannelUrl()
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className ?? "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"}>
      <MessageCircle className="size-4 text-primary-dark" aria-hidden />Seguir el canal en WhatsApp
    </a>
  )
}
