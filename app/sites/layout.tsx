import { Suspense } from "react"
import { cookies } from "next/headers"
import { getTokens } from "next-firebase-auth-edge"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { SitesModule } from "@/presentation/sites/components/SitesModule"

// Módulo 100% cliente: las páginas hijas devuelven null (no hay segmento que validar).
export const instant = false

// El flag admin se calcula en servidor (solo cambia el texto de la declaración; el servidor lo recalcula).
async function SitesModuleWithRole() {
  const tokens = await getTokens(await cookies(), authConfig).catch(() => null)
  const uid = tokens?.decodedToken?.uid
  return <SitesModule isQhpaAdmin={!!uid && isQhpaAdmin(uid)} />
}

export default function SitesLayout() {
  return (
    <Suspense>
      <SitesModuleWithRole />
    </Suspense>
  )
}
