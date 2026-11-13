import { test } from "node:test"
import assert from "node:assert/strict"
import { parseActivityInput } from "./ActivityDto"

const valid = () => ({
  title: "  Senderismo los domingos ",
  tagline: "Caminata con almuerzo",
  description: "Salimos cada domingo a caminar por los cerros de Ibagué, con almuerzo incluido.",
  siteId: null,
  category: "aire-libre",
  companions: ["amigos"],
  difficulty: "medium",
  durationMinutes: 240,
  ageNote: "",
  meetingPoint: { mode: "sharedAfterJoining", text: "", references: "" },
  schedule: { rules: [{ kind: "weekly", weekdays: [0], start: "06:00" }], skipDates: [], requiresReservation: false },
  priceOptions: [{ label: "Salida completa", amountCop: 40000, unit: "persona", includes: ["Almuerzo"] }],
  extras: [{ label: "Con agua", amountCop: 3000, unit: "persona" }],
  sections: [{ title: " Qué llevar ", body: " Agua y gorra " }, { title: "", body: "huérfana" }],
  cta: { kind: "whatsapp", value: "300 123 4567" },
})

const fail = (patch: Record<string, unknown>) => {
  const r = parseActivityInput({ ...valid(), ...patch })
  assert.equal(r.ok, false, JSON.stringify(patch))
  return (r as { ok: false; error: string }).error
}

test("una entrada válida se normaliza (título recortado, secciones y botón limpios)", () => {
  const r = parseActivityInput(valid())
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.value.title, "Senderismo los domingos")
  assert.deepEqual(r.value.sections, [{ title: "Qué llevar", body: "Agua y gorra" }])
  assert.deepEqual(r.value.cta, { kind: "whatsapp", value: "https://wa.me/573001234567" })
  assert.equal(r.value.meetingPoint.geo, null)
  assert.equal(r.value.siteId, null)
})

test("campos opcionales toman su valor por defecto", () => {
  const { tagline, companions, difficulty, durationMinutes, ageNote, sections, cta, extras, ...rest } = valid()
  void tagline; void companions; void difficulty; void durationMinutes; void ageNote; void sections; void cta; void extras
  const r = parseActivityInput(rest)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.deepEqual([r.value.tagline, r.value.companions, r.value.difficulty, r.value.durationMinutes, r.value.cta, r.value.sections, r.value.extras], ["", [], null, null, null, [], []])
})

test("basura que no es objeto se rechaza sin lanzar", () => {
  for (const x of [null, undefined, "x", 3, []]) assert.equal(parseActivityInput(x).ok, false)
})

test("título, descripción y categoría inválidos dan mensajes en español", () => {
  assert.match(fail({ title: "ab" }), /título/i)
  assert.match(fail({ description: "corta" }), /descripción/i)
  assert.match(fail({ category: "nada" }), /categoría/i)
  assert.match(fail({ title: undefined }), /título/i)
})

test("HTML y enlaces en textos se rechazan", () => {
  assert.match(fail({ description: "Visita https://mi-sitio.com para más información de la salida." }), /enlaces/i)
  assert.match(fail({ title: "Salida <b>hoy</b>" }), /etiquetas/i)
})

test("horario y precios se validan con las reglas del dominio", () => {
  assert.match(fail({ schedule: { rules: [], skipDates: [], requiresReservation: false } }), /regla/i)
  assert.match(fail({ schedule: { rules: [{ kind: "weekly", weekdays: [9], start: "06:00" }], skipDates: [], requiresReservation: false } }), /día/i)
  assert.match(fail({ priceOptions: [] }), /precio/i)
  assert.match(fail({ extras: [{ label: "x", amountCop: -1, unit: "persona" }] }), /precio/i)
})

test("el botón inseguro o 'checkout' se rechaza", () => {
  assert.match(fail({ cta: { kind: "website", value: "javascript:alert(1)" } }), /https/i)
  assert.match(fail({ cta: { kind: "checkout", value: "https://x.com" } }), /disponible/i)
})

test("punto de encuentro: modo inválido y coordenadas fuera de rango", () => {
  assert.match(fail({ meetingPoint: { mode: "otro", text: "", references: "" } }), /punto de encuentro/i)
  assert.match(fail({ meetingPoint: { mode: "fixed", text: "Parque", references: "", geo: { lat: 95, lng: 0 } } }), /punto de encuentro|ubicación/i)
})

test("campos desconocidos (uid, estado de moderación) se ignoran: no se pueden inyectar", () => {
  const r = parseActivityInput({ ...valid(), ownerUid: "otro", moderationStatus: "approved", rating: { count: 99 }, isActive: false })
  assert.equal(r.ok, true)
  if (!r.ok) return
  for (const k of ["ownerUid", "moderationStatus", "rating", "isActive"]) assert.equal(k in r.value, false)
})

test("inscripciones: cupo opcional entre 1 y 500; sin 'join' = no recibe inscripciones", () => {
  const ok = (join: unknown) => parseActivityInput({ ...valid(), join })
  const none = ok(undefined)
  assert.ok(none.ok && none.value.join === null)
  const open = ok({ capacity: null })
  assert.ok(open.ok && open.value.join?.capacity === null)
  const cap = ok({ capacity: 12 })
  assert.ok(cap.ok && cap.value.join?.capacity === 12)
  for (const capacity of [0, -1, 501, 2.5, "10"]) assert.equal(ok({ capacity }).ok, false, String(capacity))
})

test("inscripciones: 'cómo se paga' opcional, una línea de máximo 200 caracteres", () => {
  const ok = (payInstructions: unknown) => parseActivityInput({ ...valid(), join: { capacity: 10, payInstructions } })
  const a = ok("  Nequi 300 765 4321  ")
  assert.ok(a.ok && a.value.join?.payInstructions === "Nequi 300 765 4321")
  const none = parseActivityInput({ ...valid(), join: { capacity: 10 } })
  assert.ok(none.ok && none.value.join?.payInstructions === "")
  assert.equal(ok("a".repeat(201)).ok, false)
  assert.equal(ok("a\nb").ok, false)
})

const rooms = [{ name: "Sala de lectura", description: "", capacity: 12, priceCop: 40000, unit: "hora", rules: "" }]

test("espacios: una actividad GLOBAL los rechaza (no los descarta en silencio)", () => {
  assert.match(fail({ spaces: rooms }), /solo van en actividades de un sitio/)
})
test("espacios: una actividad de sitio los acepta y normaliza", () => {
  const r = parseActivityInput({ ...valid(), siteId: "s1", spaces: rooms })
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.value.spaces[0].capacity, 12)
})
