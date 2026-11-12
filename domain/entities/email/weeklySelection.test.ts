import { test } from "node:test"
import assert from "node:assert/strict"
import { selectWeeklyItems, WEEKLY_PER_DAY, WEEKLY_TOTAL } from "./weeklySelection"
import type { Digest, DigestItem } from "@/domain/entities/activities/weeklyDigest"

const it = (n: number, kind: "event" | "activity", o: Partial<DigestItem> = {}): DigestItem => ({ kind, title: `${kind}${n}`, timeLabel: "5:00 p. m.", place: "x", detail: "Gratis", url: `/${kind}/${n}`, sortMin: 600 + n, ...o })
const digest = (): Digest => ({
  title: "t",
  days: ["2026-11-13", "2026-11-14", "2026-11-15"].map((date, d) => ({ date, label: `d${d}`, items: [
    ...Array.from({ length: 6 }, (_, n) => it(d * 20 + n, "activity", n % 2 ? { imageUrl: "i.jpg" } : {})),
    ...Array.from({ length: 4 }, (_, n) => it(d * 20 + 10 + n, "event", { imageUrl: "i.jpg", score: n * 10 })),
  ] })),
})

test("tope por día y total; mezcla actividades y eventos; destacado con foto", () => {
  const items = selectWeeklyItems(digest(), "u1|2026-11-12")
  assert.ok(items.length <= WEEKLY_TOTAL)
  for (const d of new Set(items.map((i) => i.day))) assert.ok(items.filter((i) => i.day === d).length <= WEEKLY_PER_DAY)
  assert.ok(items.filter((i) => i.path.startsWith("/activity")).length >= 2 && items.filter((i) => i.path.startsWith("/event")).length >= 2)
  const stars = items.filter((i) => i.star); assert.equal(stars.length, 1); assert.ok(stars[0].imageUrl)
})
test("estable con la misma semilla y distinto con otra (variado en cada envío)", () => {
  const a = selectWeeklyItems(digest(), "u1|2026-11-12").map((i) => i.path)
  assert.deepEqual(a, selectWeeklyItems(digest(), "u1|2026-11-12").map((i) => i.path))
  const others = ["u1|2026-11-19", "u1|2026-11-26", "u2|2026-11-12", "u3|2026-11-12"].map((s) => selectWeeklyItems(digest(), s).map((i) => i.path).join())
  assert.ok(others.some((o) => o !== a.join()))
})
test("sin planes no hay correo; sin fotos no hay destacado", () => {
  assert.deepEqual(selectWeeklyItems({ title: "t", days: [] }, "s"), [])
  const d: Digest = { title: "t", days: [{ date: "2026-11-13", label: "d0", items: [it(1, "activity")] }] }
  assert.equal(selectWeeklyItems(d, "s").filter((i) => i.star).length, 0)
})

test("un plan de varios días sale una vez, con su rango; los sitios cambian con la semilla", async () => {
  const { selectWeeklySites } = await import("./weeklySelection")
  const feria = (date: string, label: string): { date: string; label: string; items: DigestItem[] } => ({ date, label, items: [it(1, "event", { url: "/eventos/feria", title: "Feria", timeLabel: "10:00 a. m." })] })
  const d: Digest = { title: "t", days: [feria("2026-11-14", "sábado 14"), feria("2026-11-15", "domingo 15")] }
  const items = selectWeeklyItems(d, "s")
  assert.equal(items.length, 1); assert.match(items[0].time!, /^sábado 14 al domingo 15 · 10:00 a\. m\.$/); assert.equal(items[0].day, "sábado 14")
  const sites = Array.from({ length: 8 }, (_, i) => ({ title: `S${i}`, url: `/s/${i}`, place: "p", imageUrl: i < 6 ? "i.jpg" : undefined }))
  const a = selectWeeklySites({ ...d, sites }, "u1|a").map((s) => s.url)
  assert.equal(a.length, 3); assert.ok(a.every((u) => sites.find((s) => s.url === u)?.imageUrl))
  assert.ok(["u1|b", "u2|a", "u3|a", "u4|a"].some((seed) => selectWeeklySites({ ...d, sites }, seed).map((s) => s.url).join() !== a.join()))
})
