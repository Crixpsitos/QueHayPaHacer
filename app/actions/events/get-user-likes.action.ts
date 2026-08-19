"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { cacheLife, cacheTag } from "next/cache";

const fetchLike = async (eventId: string, userId: string): Promise<boolean> => {
  "use cache";
  cacheLife("hours");
  cacheTag(`event-interaction-${userId}-${eventId}`);
  const { eventInteractionsService } = createServerContainer();
  const interaction = await eventInteractionsService.getByEventAndUser(eventId, userId);
  return !!interaction?.liked;
};

export async function getUserLikesAction(
  eventIds: string[],
): Promise<Record<string, boolean>> {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens?.decodedToken?.uid || eventIds.length === 0) return {};

  const userId = tokens.decodedToken.uid;
  const results = await Promise.all(
    eventIds.map(async (id) => ({ id, liked: await fetchLike(id, userId) })),
  );

  return Object.fromEntries(results.map(({ id, liked }) => [id, liked]));
}
