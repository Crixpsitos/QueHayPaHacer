import { createServerContainer } from "@/infraestructure/di/container";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { EventDraftModal } from "../modal/EventDraftModal";

export const ServerDraftEventModalHydration = async ({ isNew }: { isNew: boolean }) => {
  const tokens = await getTokens(await cookies(), authConfig);
  
  if (!tokens?.decodedToken?.uid) {
    return null;
  }

  let draftId: string | null = null;

  if (!isNew) {
    const { eventsService } = createServerContainer();
    const event = await eventsService.findLastDraftEventToUser(tokens.decodedToken.uid);
    draftId = event?.id || null;
  }


  if (!draftId) {
    return null;
  }

  return <EventDraftModal draftId={draftId} />;
};