"use client"

import { useState } from "react"
import { Globe, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { getInitials } from "@/app/lib/utils/getInitials"
import { EXTERNAL_TYPE_LABEL } from "@/presentation/studio/components/collaborators/ExternalProfileForm"
import { getExternalProfileAction, type ExternalProfilePublic } from "@/app/actions/events/get-external-profile.action"
import { SiteOwnerBadge } from "../SiteOwnerBadge"
import type { SiteOwner } from "@/domain/entities/sites/value-objects/SiteOwner"

type Network = "instagram" | "facebook" | "tiktok" | "website"
const NETWORKS: { key: Network; label: string; base?: string }[] = [
  { key: "instagram", label: "Instagram", base: "https://instagram.com/" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok", base: "https://tiktok.com/@" },
  { key: "website", label: "Sitio web" },
]

/** "@usuario" → URL de la red; las URLs completas pasan tal cual. */
function toUrl(value: string, base?: string) {
  const v = value.trim()
  if (/^https?:\/\//i.test(v)) return v
  return base ? `${base}${v.replace(/^@/, "")}` : `https://${v}`
}

/**
 * Dueño de un sitio administrado por QHPA en la ficha pública. Al tocarlo abre una tarjeta:
 * quién es el dueño (bio y redes) y que QHPA administra el sitio con su autorización.
 */
export function SiteOwnerDialog({ owner }: { owner: SiteOwner }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ExternalProfilePublic | null>(null)

  const show = async () => {
    setOpen(true)
    if (profile) return
    setLoading(true)
    const res = await getExternalProfileAction(owner.id)
    setLoading(false)
    if (res.success && res.profile) setProfile(res.profile)
  }

  const links = NETWORKS.filter((n) => profile?.socialLinks?.[n.key])

  return (
    <>
      <div className="flex items-center gap-4">
        <div onClick={show} className="cursor-pointer">
          <SiteOwnerBadge owner={owner} />
        </div>
        <button type="button" onClick={show} className="min-w-0 text-left">
          <p className="font-semibold hover:underline">{owner.displayName}</p>
          <p className="text-sm text-muted-foreground">Administrado por Que hay pa hacer</p>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border border-border">
                {owner.photoURL && <AvatarImage src={owner.photoURL} alt={owner.displayName} />}
                <AvatarFallback>{getInitials(owner.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <DialogTitle>{owner.displayName}</DialogTitle>
                <DialogDescription>
                  Dueños del sitio{profile ? ` · ${EXTERNAL_TYPE_LABEL[profile.type]}` : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loading && <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-label="Cargando" />}
          {profile?.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((n) => (
                <a
                  key={n.key}
                  href={toUrl(profile!.socialLinks![n.key]!, n.base)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                >
                  {n.key === "website" && <Globe className="size-4" />}
                  {n.label}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Avatar className="size-9">
              <AvatarImage src="/logo.png" alt="Que hay pa hacer" />
              <AvatarFallback>QH</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              Administrado por <span className="font-medium text-foreground">Que hay pa hacer</span>, con la autorización del dueño.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
