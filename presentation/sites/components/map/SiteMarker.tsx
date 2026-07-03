"use client"

import { MapPin } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"
import { STATUS_COLORS } from "../../lib/constants"
import type { SiteDisplayStatus } from "../../view-models/SiteFormViewModel"

interface BrowseMarkerPinProps {
  status: SiteDisplayStatus
  name: string
  coverUrl?: string
  active: boolean
}

export function BrowseMarkerPin({ status, name, coverUrl, active }: BrowseMarkerPinProps) {
  const color = STATUS_COLORS[status]
  return (
    <div className={cn("relative flex flex-col items-center transition-transform duration-150", active ? "scale-125 -translate-y-1" : "scale-100")}>
      <div
        className={cn(
          "flex size-10 items-center justify-center overflow-hidden rounded-full border-2 shadow-md transition-shadow",
          color.ring,
          active ? "shadow-lg" : "shadow-sm",
        )}
        style={{ backgroundColor: active && coverUrl ? "transparent" : color.hex }}
        title={name}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={name} className="size-full object-cover" />
        ) : (
          <MapPin className="size-5 text-white" />
        )}
      </div>
      <div className="h-2 w-0.5" style={{ backgroundColor: color.hex }} />
      <div className="size-1 rounded-full opacity-60" style={{ backgroundColor: color.hex }} />
    </div>
  )
}

interface PickMarkerPinProps {
  coverUrl?: string
  lifted?: boolean
}

export function PickMarkerPin({ coverUrl, lifted }: PickMarkerPinProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center transition-transform duration-150",
        lifted ? "-translate-y-3 scale-110" : "scale-100",
      )}
    >
      <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary shadow-lg">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <MapPin className="size-5 text-primary-foreground" />
        )}
      </div>
      {/* pin tail */}
      <div className="h-3 w-0.5 bg-primary" />
      <div className="size-1.5 rounded-full bg-primary/60" />
    </div>
  )
}
