"use client"

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/app/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { getInitials } from "@/app/lib/utils/getInitials"
import type { SiteOwner } from "@/domain/entities/sites/value-objects/SiteOwner"

/**
 * Sitio administrado por QHPA: foto del dueño al frente y el logo de QHPA detrás.
 * Cada avatar dice al pasar el mouse (o enfocarlo) qué papel tiene.
 */
export function SiteOwnerBadge({ owner, className }: { owner: Pick<SiteOwner, "displayName" | "photoURL">; className?: string }) {
  return (
    <TooltipProvider>
      <AvatarGroup className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar tabIndex={0} className="relative z-10 size-10 cursor-default ring-2 ring-background">
              {owner.photoURL && <AvatarImage src={owner.photoURL} alt={owner.displayName} />}
              <AvatarFallback>{getInitials(owner.displayName)}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>Dueños</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar tabIndex={0} className="size-10 cursor-default ring-2 ring-background">
              <AvatarImage src="/logo.png" alt="Que hay pa hacer" />
              <AvatarFallback>QH</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>Administrado por Que hay pa hacer</TooltipContent>
        </Tooltip>
      </AvatarGroup>
    </TooltipProvider>
  )
}
