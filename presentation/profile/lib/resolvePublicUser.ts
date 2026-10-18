import { createServerContainer } from "@/infraestructure/di/container";
import type { User } from "@/domain/entities/user/User";
import { normalizeHandle } from "./normalizeHandle";

export const resolvePublicUser = async (rawHandle: string): Promise<User | null> => {
  const handle = normalizeHandle(rawHandle);

  if (!handle) {
    return null;
  }

  const { userService } = createServerContainer();

  const byUsername = await userService.getUserByUsername(handle);
  if (byUsername) {
    return byUsername;
  }

  return userService.getUserById(handle);
};
