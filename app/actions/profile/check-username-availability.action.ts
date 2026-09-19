"use server";

import { createServerContainer } from "@/infraestructure/di/container";
import { generateUsername } from "@/app/lib/utils/generateUsername";

export async function checkUsernameAvailabilityAction(
  username: string,
  currentUid: string,
): Promise<{ available: boolean }> {
  const normalizedUsername = generateUsername(username);
  if (normalizedUsername.length < 3) return { available: false };
  try {
    const { userService } = createServerContainer();
    const existing = await userService.getUserByUsername(normalizedUsername);
    return { available: !existing || existing.uid === currentUid };
  } catch {
    return { available: false };
  }
}