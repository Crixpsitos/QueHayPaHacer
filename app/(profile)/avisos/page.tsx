import type { Metadata } from "next"
import { Container } from "@/app/components/layout/shared/Container"
import { NotificationPrefsForm } from "@/presentation/notificationPrefs/components/NotificationPrefsForm"

export const metadata: Metadata = { title: "Mis avisos", robots: { index: false, follow: false } }

export default function AvisosPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-2xl gap-5">
        <h1 className="font-heading text-3xl font-bold">Mis avisos</h1>
        <p className="text-sm text-muted-foreground">Elige qué quieres recibir y por dónde. Por defecto solo te escribimos sobre las actividades donde reservaste un cupo.</p>
        <NotificationPrefsForm />
      </div>
    </Container>
  )
}
