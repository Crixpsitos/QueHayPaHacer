import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { generateLinkCode, isLinkCode, isLinkTargetType, type LinkTarget } from "@/domain/entities/links/link"

export interface LinkDoc { code: string; label: string; target: LinkTarget; ownerUid: string; active: boolean }
export interface LinkWithClicks extends LinkDoc { clicks: number }
export interface LinksRepo {
  /** Falla con code 6 (ALREADY_EXISTS) si el código ya está tomado. */
  create(link: Omit<LinkDoc, "active">): Promise<void>
  findByCode(code: string): Promise<LinkDoc | null>
  recordClick(code: string, day: string): Promise<void>
  countByOwner(ownerUid: string): Promise<number>
  listByOwner(ownerUid: string, sinceDay: string): Promise<LinkWithClicks[]>
}

const MAX_LABEL = 60
const CACHE_MS = 60_000
const CACHE_MAX = 5_000
const MAX_TRIES = 5

export class LinksService {
  private readonly cache = new Map<string, { at: number; link: LinkDoc | null }>()

  constructor(
    private readonly repo: LinksRepo,
    private readonly newCode: () => string = generateLinkCode,
    private readonly now: () => number = Date.now,
  ) {}

  /** La autorización (¿es dueño de la ficha?) la hace quien llama (acción del estudio, T11); aquí solo forma y unicidad. */
  async create(input: { label: string; target: LinkTarget; ownerUid: string }): Promise<LinkDoc> {
    const label = input.label.trim()
    if (!label || label.length > MAX_LABEL) throw new Error(`La etiqueta debe tener entre 1 y ${MAX_LABEL} caracteres.`)
    if (!isLinkTargetType(input.target.type) || !input.target.id) throw new Error("Destino inválido.")
    if (!input.ownerUid) throw new Error("Falta el dueño del enlace.")
    for (let i = 0; i < MAX_TRIES; i++) {
      const link = { code: this.newCode(), label, target: input.target, ownerUid: input.ownerUid }
      try {
        await this.repo.create(link)
        return { ...link, active: true }
      } catch (e) {
        if ((e as { code?: number }).code !== 6) throw e // 6 = ya existe: se reintenta con otro código
      }
    }
    throw new Error("No se pudo generar un código libre; intenta de nuevo.")
  }

  /** Enlace activo por código, con caché de 60 s por instancia (también de los inexistentes: un barrido de códigos al azar no multiplica lecturas). */
  async resolve(code: string): Promise<LinkDoc | null> {
    if (!isLinkCode(code)) return null
    const hit = this.cache.get(code)
    if (hit && this.now() - hit.at < CACHE_MS) return hit.link
    const found = await this.repo.findByCode(code)
    const link = found?.active ? found : null
    this.cache.delete(code)
    this.cache.set(code, { at: this.now(), link })
    if (this.cache.size > CACHE_MAX) this.cache.delete(this.cache.keys().next().value as string)
    return link
  }

  recordClick(code: string, day: string): Promise<void> {
    return this.repo.recordClick(code, day)
  }

  countByOwner(ownerUid: string): Promise<number> {
    return this.repo.countByOwner(ownerUid)
  }

  /** Enlaces del dueño con clics de los últimos 30 días (para "Mis enlaces"). */
  listWithClicks(ownerUid: string): Promise<LinkWithClicks[]> {
    return this.repo.listByOwner(ownerUid, bogotaDay(new Date(this.now() - 30 * 24 * 3600_000)))
  }
}
