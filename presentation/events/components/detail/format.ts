/**
 * Formato de fechas y precios del detalle de evento. Todo en hora de Colombia:
 * servidor (UTC) y navegador deben producir el mismo texto o la hidratación falla.
 */
const TZ = "America/Bogota";

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opts });

const timeFmt = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const keyFmt = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });
const longFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dayMonthFmt = fmt({ day: "numeric", month: "long" });
const weekdayFmt = fmt({ weekday: "long" });
const weekdayShortFmt = fmt({ weekday: "short" });
const dayFmt = fmt({ day: "numeric" });
const monthFmt = fmt({ month: "long" });
const monthShortFmt = fmt({ month: "short" });
const yearFmt = fmt({ year: "numeric" });

type DateInput = string | Date;
const d = (v: DateInput) => new Date(v);
const stripDot = (s: string) => s.replace(/\.$/, "");

export const sameDay = (a: DateInput, b: DateInput) => keyFmt.format(d(a)) === keyFmt.format(d(b));

export const formatTime = (v: DateInput) => timeFmt.format(d(v));

/** "sábado, 10 de octubre de 2026" */
export const formatDateLong = (v: DateInput) => longFmt.format(d(v));

/** "10 de octubre" */
export const formatDayMonth = (v: DateInput) => dayMonthFmt.format(d(v));

/** Piezas para el bloque de fecha de la boleta. */
export function dateParts(v: DateInput) {
  const date = d(v);
  return {
    weekday: weekdayFmt.format(date),
    weekdayShort: stripDot(weekdayShortFmt.format(date)),
    day: dayFmt.format(date),
    month: monthFmt.format(date),
    monthShort: stripDot(monthShortFmt.format(date)),
    year: yearFmt.format(date),
  };
}

/** "19:00 – 23:00" mismo día o noche que termina antes de 24 h; si no, incluye la fecha de cierre. */
export function formatTimeRange(start: DateInput, end: DateInput) {
  const overnight = d(end).getTime() - d(start).getTime() < 24 * 3_600_000;
  return sameDay(start, end) || overnight
    ? `${formatTime(start)} – ${formatTime(end)}`
    : `${formatTime(start)} – ${formatDayMonth(end)}, ${formatTime(end)}`;
}

/** "Del 10 de octubre al 3 de noviembre" (o solo el día si coinciden). */
export function formatDateRange(start: DateInput, end: DateInput) {
  return sameDay(start, end)
    ? formatDayMonth(start)
    : `Del ${formatDayMonth(start)} al ${formatDayMonth(end)}`;
}

interface PriceLike {
  isFree: boolean;
  amount: number;
  currency?: string;
  tiers?: { name: string; amount: number }[];
}

function money(amount: number, currency?: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Categorías de entrada (solo si hay 2 o más; con una sola no hay nada que elegir). */
export function priceTiers(price: PriceLike) {
  return !price.isFree && price.tiers && price.tiers.length > 1 ? price.tiers : [];
}

/** Precio para mostrar. Sin precio (eventos de varias fechas: el precio vive en cada función) devuelve "". */
export function formatPrice(price: PriceLike | null | undefined) {
  if (!price) return "";
  if (price.isFree || !price.amount) return "Gratis";
  const min = priceTiers(price).length ? Math.min(...price.tiers!.map((t) => t.amount)) : price.amount;
  return `${priceTiers(price).length ? "Desde " : ""}${money(min, price.currency)}`;
}

export function formatTierAmount(price: PriceLike, amount: number) {
  return money(amount, price.currency);
}

/** Resumen de precio para varias fechas: "Gratis", "$ 20.000" o "Desde $ 15.000". */
export function formatPriceSummary(prices: PriceLike[]) {
  const paid = prices.filter((p) => !p.isFree && p.amount > 0);
  if (paid.length === 0) return "Gratis";
  if (paid.length < prices.length) return "Desde gratis";
  const min = paid.reduce((a, b) => (b.amount < a.amount ? b : a));
  const allSame = paid.every((p) => p.amount === min.amount);
  return `${allSame ? "" : "Desde "}${formatPrice({ ...min, tiers: undefined })}`;
}
