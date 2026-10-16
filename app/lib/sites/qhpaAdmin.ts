import "server-only"

/** Cuentas que publican "en nombre de QHPA" (lista de uid separados por coma en QHPA_ADMIN_UIDS). */
export function isQhpaAdmin(uid: string): boolean {
  return (process.env.QHPA_ADMIN_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(uid)
}
