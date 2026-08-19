"use server";

import { createServerContainer } from "@/infraestructure/di/container";

/** Returns true if the username is not taken by anyone other than `currentUid`. */
export async function checkUsernameAvailabilityAction(
  username: string,
  currentUid: string,
): Promise<{ available: boolean }> {
  if (!username || username.length < 3) return { available: false };
  try {
    const { userService } = createServerContainer();
    const existing = await userService.getUserByUsername(username);
    return { available: !existing || existing.uid === currentUid };
  } catch {
    return { available: false };
  }
}
