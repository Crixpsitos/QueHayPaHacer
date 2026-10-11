import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUid } from "@/app/actions/_session";
import { Container } from "@/app/components/layout/shared/Container";
import { createServerContainer } from "@/infraestructure/di/container";
import { MyInvitations } from "@/presentation/profile/components/invitations/MyInvitations";
import { MyInvitationsSkeleton } from "@/presentation/profile/components/invitations/MyInvitationsSkeleton";

export const metadata: Metadata = { title: "Mis invitaciones" };

// Sesión (cookies) + Firestore: dinámico, dentro de Suspense. No requiere Premium.
async function InvitationsContent() {
  const uid = await getSessionUid();
  if (!uid) redirect("/login?redirect_to=%2Fmis-invitaciones");
  const received = await createServerContainer().studioService.getReceivedInvitations(uid);
  return (
    <MyInvitations
      initial={received.map((i) => ({
        id: i.id,
        fromUid: i.fromUid,
        fromDisplayName: i.fromDisplayName,
        fromPhotoURL: i.fromPhotoURL,
        fromCreatorVerified: i.fromCreatorVerified,
        invitedAt: i.invitedAt.toISOString(),
      }))}
    />
  );
}

export default function MyInvitationsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Suspense fallback={<MyInvitationsSkeleton />}>
        <InvitationsContent />
      </Suspense>
    </Container>
  );
}
