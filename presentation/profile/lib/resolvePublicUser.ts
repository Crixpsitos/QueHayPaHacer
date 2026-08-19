import { createServerContainer } from "@/infraestructure/di/container";
import type { User } from "@/domain/entities/user/User";

export const resolvePublicUser = async (rawHandle: string): Promise<User | null> => {
  // Next.js ya decodifica el segmento dinámico de la ruta; solo normalizamos el prefijo "@".
  const handle = rawHandle.trim().replace(/^@/, "");

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
