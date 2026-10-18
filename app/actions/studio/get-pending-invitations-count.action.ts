"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getSessionUid } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";

// Cacheado por usuario: el menú de cuenta lo pide en cada carga y no debe costar una query cada vez.
// Se invalida al responder (respond action); una invitación nueva tarda como mucho unos minutos.
async function countPending(uid: string): Promise<number> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`invitations-${uid}`);
  return (await createServerContainer().studioService.getReceivedInvitations(uid)).length;
}

/** Cuenta de invitaciones de colaboración pendientes del usuario en sesión (no requiere Premium). */
export async function getPendingInvitationsCountAction(): Promise<number> {
  const uid = await getSessionUid();
  if (!uid) return 0;
  try {
    return await countPending(uid);
  } catch {
    return 0;
  }
}
