import * as v from "valibot"
import { CreateLinkSchema } from "@/application/dto/links/CreateLinkDto"
import type { LinkTarget } from "@/domain/entities/links/link"

export const MAX_LINKS_PER_OWNER = 50
export type CreateLinkResult = { success: true; code: string } | { success: false; error: string }

interface Deps {
  /** uid de la sesión verificada (nunca del formulario). */
  uid: string | null
  ownsEvent: (id: string) => Promise<boolean>
  ownsSite: (id: string) => Promise<boolean>
  countMine: () => Promise<number>
  create: (input: { label: string; target: LinkTarget; ownerUid: string }) => Promise<{ code: string }>
}

/** Reglas de "crear enlace": sesión → formato → dueño de la ficha → tope → crear. Separada de la Server Action para probarla sin Firebase. */
export async function createLinkFlow(deps: Deps, raw: unknown): Promise<CreateLinkResult> {
  if (!deps.uid) return { success: false, error: "Inicia sesión para crear enlaces." }
  const parsed = v.safeParse(CreateLinkSchema, raw)
  if (!parsed.success) return { success: false, error: parsed.issues[0].message }
  const { label, targetType, targetId } = parsed.output
  const owns = targetType === "event" ? await deps.ownsEvent(targetId) : await deps.ownsSite(targetId)
  if (!owns) return { success: false, error: "Solo puedes crear enlaces de tus propios eventos y sitios." }
  if ((await deps.countMine()) >= MAX_LINKS_PER_OWNER) return { success: false, error: `Llegaste al máximo de ${MAX_LINKS_PER_OWNER} enlaces.` }
  try {
    const link = await deps.create({ label, target: { type: targetType, id: targetId }, ownerUid: deps.uid })
    return { success: true, code: link.code }
  } catch (error) {
    console.error("[create-link]", error)
    return { success: false, error: "No se pudo crear el enlace. Intenta de nuevo." }
  }
}
