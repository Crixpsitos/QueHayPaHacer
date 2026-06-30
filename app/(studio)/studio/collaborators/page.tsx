import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { CollaboratorsView } from "@/presentation/studio/components/collaborators/CollaboratorsView";
import { MOCK_STUDIO_COLLABORATORS } from "@/presentation/studio/lib/studioCollaboratorsMock";

export default async function StudioCollaboratorsPage() {
  // El nombre de la entidad sí es real (de tu perfil profesional); el resto es MOCK.
  let myEntityName = MOCK_STUDIO_COLLABORATORS.myEntityName;
  const tokens = await getTokens(await cookies(), authConfig);
  if (tokens) {
    const { userService } = createServerContainer();
    const user = await userService.getUserById(tokens.decodedToken.uid);
    myEntityName = user?.brandName || user?.displayName || myEntityName;
  }

  // MOCK. Cuando implementes el repositorio:
  //   const collaborators = await studioService.getCollaborators(uid);
  //   const entities = await studioService.getMemberEntities(uid);
  //   const invitations = await studioService.getReceivedInvitations(uid);
  const data = { ...MOCK_STUDIO_COLLABORATORS, myEntityName };

  return <CollaboratorsView data={data} />;
}
