"use client"

import { useEffect, useState } from "react"
import { SiteOwnerBadge } from "../SiteOwnerBadge"
import { getMyCollaboratorsAction } from "@/app/actions/events/get-my-collaborators.action"
import type { Collaborator } from "@/domain/entities/studio/Studio"
import type { SiteOwner } from "@/domain/entities/sites/value-objects/SiteOwner"

/** Solo para cuentas de QHPA: elige el dueño del sitio entre los perfiles externos de la red. */
export function SiteOwnerPicker({ value, onChange }: { value: SiteOwner | null | undefined; onChange: (v: SiteOwner | null) => void }) {
  const [options, setOptions] = useState<Collaborator[] | null>(null)

  useEffect(() => {
    getMyCollaboratorsAction().then((r) => setOptions((r.collaborators ?? []).filter((c) => c.kind === "external")))
  }, [])

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <label className="text-xs font-medium text-foreground" htmlFor="site-owner">Dueño del sitio (administrado por QHPA)</label>
      <select
        id="site-owner"
        value={value?.id ?? ""}
        onChange={(e) => {
          const c = options?.find((o) => o.refId === e.target.value)
          onChange(c ? { id: c.refId, displayName: c.displayName, photoURL: c.photoURL ?? "" } : null)
        }}
        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">Sin dueño asignado</option>
        {/* El dueño ya guardado se conserva aunque la lista aún no cargue. */}
        {value && !options?.some((o) => o.refId === value.id) && <option value={value.id}>{value.displayName}</option>}
        {options?.map((o) => <option key={o.refId} value={o.refId}>{o.displayName}</option>)}
      </select>
      {options?.length === 0 && (
        <p className="text-[11px] text-muted-foreground">No tienes perfiles externos. Crea uno en Colaboradores y vuelve aquí.</p>
      )}
      {value && <SiteOwnerBadge owner={value} />}
    </div>
  )
}
