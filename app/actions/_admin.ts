import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"

/** uid de la sesión si es administrador de QHPA (QHPA_ADMIN_UIDS), si no null. Las acciones de admin lo exigen. */
export async function getAdminUid(): Promise<string | null> {
  const uid = await getSessionUid()
  return uid && isQhpaAdmin(uid) ? uid : null
}
