/** Operaciones puras de edición de listas en formularios (sin mutar). */
export const updateItem = <T,>(list: T[], i: number, patch: Partial<T>): T[] =>
  list.map((x, idx) => (idx === i ? { ...x, ...patch } : x))

export const removeItem = <T,>(list: T[], i: number): T[] => list.filter((_, idx) => idx !== i)

export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (i < 0 || i >= list.length || j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}
