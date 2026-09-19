import { createServerContainer } from "@/infraestructure/di/container";
import type { User } from "@/domain/entities/user/User";

export const resolvePublicUser = async (rawHandle: string): Promise<User | null> => {
  let handle = rawHandle.trim();
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const decoded = decodeURIComponent(handle);
      if (decoded === handle) break;
      handle = decoded;
    } catch {
      break;
    }
  }
  handle = handle.replace(/^@/, "");

  if (!handle) {
    return null;
  }

  const { userService } = createServerContainer();

  const byUsername = await userService.getUserByUsername(handle);
  if (byUsername) {
    return byUsername;
  }

  const byId = await userService.getUserById(handle);
  if (byId) {
    return byId;
  }

  const normalizedHandle = handle.toLocaleLowerCase("es");
  const users = await userService.getAllUsers();
  return users.find(
    (user) => user.displayName.toLocaleLowerCase("es") === normalizedHandle,
  ) ?? null;
};
