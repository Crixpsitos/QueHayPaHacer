/** "hace 3 días", "hace 2 meses"... en español. Para fechas futuras o de hace menos de un minuto: "hace un momento". */
export function timeAgoEs(ms: number, now: number): string {
  const min = Math.floor((now - ms) / 60_000)
  if (min < 1) return "hace un momento"
  const unit = (n: number, one: string, many: string) => `hace ${n === 1 ? `1 ${one}` : `${n} ${many}`}`
  if (min < 60) return unit(min, "minuto", "minutos")
  const hours = Math.floor(min / 60)
  if (hours < 24) return unit(hours, "hora", "horas")
  const days = Math.floor(hours / 24)
  if (days < 30) return unit(days, "día", "días")
  const months = Math.floor(days / 30)
  if (months < 12) return unit(months, "mes", "meses")
  const years = Math.floor(days / 365)
  return unit(years, "año", "años")
}
