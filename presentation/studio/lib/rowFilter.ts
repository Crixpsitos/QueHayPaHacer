const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
const digits = (s: string) => s.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "")

/** Filtra en memoria filas ya cargadas por nombre, correo o teléfono (parcial; ignora espacios, guiones y +57). Sin consultas nuevas. */
export function filterRows<T extends { name?: string | null; email?: string | null; phone?: string | null }>(rows: readonly T[], q: string): T[] {
  const text = fold(q.trim())
  if (!text) return [...rows]
  const d = digits(text)
  const noCode = text.startsWith("+57") ? d.slice(2) : d // «+57 310…» parcial: se compara sin el indicativo
  return rows.filter((r) => fold(`${r.name ?? ""} ${r.email ?? ""}`).includes(text) || (noCode.length >= 3 && digits(r.phone ?? "").includes(noCode)))
}
