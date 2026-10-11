"use server";

import { getMyTeamAccess } from "@/app/actions/_session";

/** ¿La sesión es miembro de eventos ajenos con acceso al Studio? (caché corto en `listMyTeamEvents`; solo decide si se muestra el acceso). */
export async function hasTeamEventsAction(): Promise<boolean> {
  try {
    return (await getMyTeamAccess()).hasTeamEvents;
  } catch {
    return false;
  }
}
