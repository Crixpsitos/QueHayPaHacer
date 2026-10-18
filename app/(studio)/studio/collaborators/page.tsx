import type { Metadata } from "next";
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { CollaboratorsView } from "@/presentation/studio/components/collaborators/CollaboratorsView";
import type { StudioCollaboratorsViewModel } from "@/presentation/studio/view-models/StudioCollaboratorsViewModel";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function StudioCollaboratorsPage() {
  await redirectLimitedToEvents();

  let data: StudioCollaboratorsViewModel = { received: [], sent: [], network: [] };

  // Premium verificado aquí también: el layout (StudioGate) no protege requests RSC directas.
  const uid = await getPremiumSessionUid();
  if (uid) {
    const { studioService } = createServerContainer();
    const [received, sent, network] = await Promise.all([
      studioService.getReceivedInvitations(uid),
      studioService.getSentInvitations(uid),
      studioService.getCollaborators(uid),
    ]);

    data = {
      received: received.map((i) => ({
        id: i.id,
        fromUid: i.fromUid,
        fromDisplayName: i.fromDisplayName,
        fromPhotoURL: i.fromPhotoURL,
        fromCreatorVerified: i.fromCreatorVerified,
        invitedAt: i.invitedAt.toISOString(),
      })),
      sent: sent.map((i) => ({
        id: i.id,
        toDisplayName: i.toDisplayName,
        toPhotoURL: i.toPhotoURL,
        toEmail: i.toEmail,
        invitedAt: i.invitedAt.toISOString(),
      })),
      network: network.map((c) => ({
        refId: c.refId,
        kind: c.kind,
        displayName: c.displayName,
        photoURL: c.photoURL,
        creatorVerified: c.creatorVerified,
      })),
    };
  }

  return <CollaboratorsView data={data} />;
}
