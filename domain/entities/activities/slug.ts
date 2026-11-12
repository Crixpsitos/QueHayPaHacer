import { toSlug } from "@/app/lib/utils/slug"

export const SLUG_MAX = 60
const MAX_TRIES = 50
/** Rutas fijas bajo /actividades que un slug no puede ocupar. */
const RESERVED = new Set(["crear", "mis", "editar", "nueva", "nuevo"])

/** Base del slug a partir del título. Estable: el slug no cambia aunque se edite el título (SEO). */
export function slugifyActivity(title: string): string {
  const s = toSlug(title).slice(0, SLUG_MAX).replace(/^-+|-+$/g, "")
  if (!s) return "actividad"
  return RESERVED.has(s) ? `${s}-actividad` : s
}

/** `exists` consulta si el slug ya está en uso. Numera "-2", "-3"… y, si se agotan, añade un sufijo aleatorio. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const withSuffix = (suffix: string) => `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/, "")}${suffix}`
  if (!(await exists(base))) return base
  for (let i = 2; i < MAX_TRIES; i++) {
    const candidate = withSuffix(`-${i}`)
    if (!(await exists(candidate))) return candidate
  }
  return withSuffix(`-${Math.random().toString(36).slice(2, 8)}`)
}
