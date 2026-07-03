import { Suspense } from "react"
import { SitesModule } from "@/presentation/sites/components/SitesModule"

export default function SitesLayout() {
  return (
    <Suspense>
      <SitesModule />
    </Suspense>
  )
}
