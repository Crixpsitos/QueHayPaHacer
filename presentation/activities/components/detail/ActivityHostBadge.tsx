"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/app/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { getInitials } from "@/app/lib/utils/getInitials"

type Person = { displayName: string; photoURL: string }

/**
 * Quién está detrás de la actividad. Si el sitio tiene dueño (lo subió QHPA con su autorización): el dueño al frente y
 * quien publicó atrás, como en la ficha del sitio. Si no, solo quien organiza.
 */
export function ActivityHostBadge({ host, site }: { host: Person; site: { name: string; slug: string; owner: Person | null } | null }) {
  const owner = site?.owner ?? null
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <AvatarGroup>
          {owner ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar tabIndex={0} className="relative z-10 size-10 cursor-default ring-2 ring-background">
                  {owner.photoURL ? <AvatarImage src={owner.photoURL} alt={owner.displayName} /> : null}
                  <AvatarFallback>{getInitials(owner.displayName)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Dueño del sitio</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar tabIndex={0} className="size-10 cursor-default ring-2 ring-background">
                {host.photoURL ? <AvatarImage src={host.photoURL} alt={host.displayName} /> : null}
                <AvatarFallback>{getInitials(host.displayName)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{owner ? "Publicada por" : "Organiza"} {host.displayName}</TooltipContent>
          </Tooltip>
        </AvatarGroup>
        <span className="grid gap-0.5 leading-snug">
          {site ? (
            <span>En <Link href={`/donde-ir/${site.slug}`} className="font-semibold text-foreground underline underline-offset-4">{site.name}</Link></span>
          ) : null}
          <span>{owner ? <>Dueño: <strong className="font-semibold text-foreground">{owner.displayName}</strong> · publicada por {host.displayName}</> : <>Organiza <strong className="font-semibold text-foreground">{host.displayName}</strong></>}</span>
        </span>
      </div>
    </TooltipProvider>
  )
}
