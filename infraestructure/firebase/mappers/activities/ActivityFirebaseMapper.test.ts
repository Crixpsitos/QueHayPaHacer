import { test } from "node:test"
import assert from "node:assert/strict"
import { ActivityFirebaseMapper } from "./ActivityFirebaseMapper"
import { makeActivity, makeImage } from "@/domain/entities/activities/activity.fixture"

const mapper = new ActivityFirebaseMapper()
const ts = (d: Date) => ({ toDate: () => d })

test("round-trip: toFirebase y toDomain devuelven la misma actividad", () => {
  const a = makeActivity({
    kind: "site",
    siteId: "s1",
    cta: { kind: "whatsapp", value: "https://wa.me/573001234567" },
    sections: [{ title: "Qué llevar", body: "Agua" }],
    meetingPoint: { mode: "fixed", text: "Parque", references: "", geo: { lat: 4.43, lng: -75.2 } },
    media: [makeImage("m1", true), makeImage("m2", false, { status: "processing" })],
    reviewedAt: new Date("2026-11-02T00:00:00Z"),
    reviewedBy: "admin1",
  })
  const dto = mapper.toFirebase(a)
  // Firestore devuelve Timestamps: los simulamos
  const stored = { ...dto, createdAt: ts(a.createdAt), updatedAt: ts(a.updatedAt), publishedAt: ts(a.publishedAt!), reviewedAt: ts(a.reviewedAt!), rejectedAt: null, nextOccurrenceAt: null }
  assert.deepEqual(mapper.toDomain(a.id, stored as never), a)
})

test("toFirebase no deja campos undefined (Firestore los rechaza)", () => {
  const dto = mapper.toFirebase(makeActivity())
  const walk = (x: unknown, path: string): void => {
    assert.notEqual(x, undefined, `undefined en ${path}`)
    if (x && typeof x === "object" && !(x instanceof Date)) for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`)
  }
  walk(dto, "dto")
})

test("toFirebase agrega los campos derivados para consultas: días de la semana y próxima salida", () => {
  const dto = mapper.toFirebase(makeActivity(), new Date("2026-11-08T10:00:00Z"))
  assert.deepEqual(dto.occursWeekdays, [0])
  assert.equal(dto.nextOccurrenceAt?.toISOString(), "2026-11-08T11:00:00.000Z")
})

test("toDomain tolera campos opcionales ausentes (documentos viejos o parciales)", () => {
  const a = makeActivity()
  const dto = mapper.toFirebase(a)
  const sparse = { ...dto, sections: undefined, extras: undefined, companions: undefined, media: undefined, cta: undefined, rating: undefined, analytics: undefined, createdAt: ts(a.createdAt), updatedAt: ts(a.updatedAt), publishedAt: null, reviewedAt: null, rejectedAt: null }
  const back = mapper.toDomain("a1", sparse as never)
  assert.deepEqual([back.sections, back.extras, back.companions, back.media, back.cta], [[], [], [], [], null])
  assert.deepEqual(back.rating, { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] })
  assert.deepEqual(back.analytics, { views: 0, clicks: 0, visits: 0, reviews: 0 })
})

test("toDomain acepta fechas como Date o como Timestamp", () => {
  const a = makeActivity()
  const dto = mapper.toFirebase(a)
  assert.deepEqual(mapper.toDomain("a1", { ...dto, createdAt: a.createdAt, updatedAt: a.updatedAt, publishedAt: null, reviewedAt: null, rejectedAt: null } as never).createdAt, a.createdAt)
})
