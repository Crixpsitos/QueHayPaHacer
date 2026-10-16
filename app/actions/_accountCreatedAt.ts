import { getFirebaseAdminAuth } from "@/infraestructure/firebase/config/admin/firebase"

/** Fecha de creación de la cuenta (ms) según Firebase Auth. undefined si no se pudo leer: el freno de cuenta nueva se omite. */
export async function getAccountCreatedAt(uid: string): Promise<number | undefined> {
  try {
    const t = Date.parse((await getFirebaseAdminAuth().getUser(uid)).metadata.creationTime)
    return Number.isFinite(t) ? t : undefined
  } catch {
    return undefined
  }
}
