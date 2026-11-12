import { complaintView, hostIdentityGate, parseHostIdentity, type ComplaintView, type HostGate, type HostIdentityRecord } from "@/domain/entities/activities/HostIdentity"
import type { IHostIdentityRepository } from "@/domain/repository/activities/IHostIdentityRepository"

type Result = { ok: true } | { ok: false; error: string }

/**
 * Registro de oferentes (Ley 1480 art. 53). `uid` y `requesterUid` SIEMPRE salen de la sesión del servidor.
 * `allow(key)` es el límite de uso de consultas (en memoria por instancia; ver ponytail de `createIpLimiter`).
 */
export class HostIdentityService {
  constructor(
    private readonly repo: IHostIdentityRepository,
    private readonly clock: () => Date = () => new Date(),
    private readonly allow: (key: string) => boolean = () => true,
  ) {}

  /** Crea o actualiza (y reconfirma) el registro. Ignora cualquier `uid` que venga dentro de `raw`. */
  async save(uid: string, raw: unknown, dataAuthorization: boolean, legalVersion: string): Promise<Result> {
    if (dataAuthorization !== true) return { ok: false, error: "Debes autorizar el tratamiento de tus datos para continuar." }
    const parsed = parseHostIdentity(raw)
    if (!parsed.ok) return parsed
    const now = this.clock()
    const record: HostIdentityRecord = { ...parsed.value, uid, confirmedAt: now, updatedAt: now, legalVersion, dataAuthorization: true }
    await this.repo.upsert(record)
    return { ok: true }
  }

  async gate(uid: string): Promise<HostGate> {
    return hostIdentityGate(await this.repo.get(uid), this.clock())
  }

  /** Quien necesita presentar una queja consulta los datos de quien ofrece. Con sesión, con límite y con bitácora. */
  async consultForComplaint(i: { requesterUid: string | null; hostUid: string; activityId: string }): Promise<{ ok: true; data: ComplaintView } | { ok: false; error: string }> {
    if (!i.requesterUid) return { ok: false, error: "Inicia sesión para consultar los datos de quien ofrece." }
    if (!this.allow(i.requesterUid)) return { ok: false, error: "Hiciste muchas consultas seguidas. Intenta de nuevo en unos minutos." }
    const record = await this.repo.get(i.hostUid)
    if (!record) return { ok: false, error: "No hay datos de identificación registrados para esta actividad." }
    await this.repo.appendAccess(i.hostUid, { by: i.requesterUid, at: this.clock(), purpose: "complaint", activityId: i.activityId })
    return { ok: true, data: complaintView(record) }
  }

  /** Entrega a la autoridad (script de administración): deja constancia de quién exportó. */
  async exportForAuthority(hostUid: string, exportedBy: string): Promise<HostIdentityRecord | null> {
    const record = await this.repo.get(hostUid)
    if (!record) return null
    await this.repo.appendAccess(hostUid, { by: exportedBy, at: this.clock(), purpose: "authority_export" })
    return record
  }
}
