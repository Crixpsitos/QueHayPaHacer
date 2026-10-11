import { Suspense } from "react"
import { SitesModule } from "@/presentation/sites/components/SitesModule"

// Módulo 100% cliente: las páginas hijas devuelven null (no hay segmento que validar).
export const instant = false

export default function SitesLayout() {
  return (
    <Suspense>
      <SitesModule />
    </Suspense>
  )
}
