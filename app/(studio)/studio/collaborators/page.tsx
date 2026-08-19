import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { CollaboratorsView } from "@/presentation/studio/components/collaborators/CollaboratorsView";
import type { StudioCollaboratorsViewModel } from "@/presentation/studio/view-models/StudioCollaboratorsViewModel";

export default async function StudioCollaboratorsPage() {
  let data: StudioCollaboratorsViewModel = { received: [], sent: [], network: [] };

  const tokens = await getTokens(await cookies(), authConfig);
  if (tokens) {
    const { studioService } = createServerContainer();
    const uid = tokens.decodedToken.uid;
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
        fromProfessionalType: i.fromProfessionalType,
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
        professionalType: c.professionalType,
      })),
    };
  }

  return <CollaboratorsView data={data} />;
}
