import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUid } from "@/app/actions/_session";
import { Container } from "@/app/components/layout/shared/Container";
import { createServerContainer } from "@/infraestructure/di/container";
import { MyRegistrations } from "@/presentation/profile/components/my-registrations/MyRegistrations";
import { MyRegistrationsSkeleton } from "@/presentation/profile/components/my-registrations/MyRegistrationsSkeleton";

export const metadata: Metadata = { title: "Mis inscripciones" };

// Datos de la sesión (cookies) y de Firestore: dinámico, dentro de Suspense.
async function RegistrationsContent() {
  const uid = await getSessionUid();
  if (!uid) redirect("/login?redirect_to=%2Fmis-inscripciones");
  const items = await createServerContainer().eventRegistrationService.listByUserId(uid);
  return <MyRegistrations items={items} />;
}

export default function MyRegistrationsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Suspense fallback={<MyRegistrationsSkeleton />}>
        <RegistrationsContent />
      </Suspense>
    </Container>
  );
}
