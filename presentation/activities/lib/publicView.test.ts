import { test } from "node:test"
import assert from "node:assert/strict"
import { makeActivity, makeImage } from "@/domain/entities/activities/activity.fixture"
import { formatDuration, toPublicView } from "./publicView"

test("duración legible", () => {
  assert.equal(formatDuration(45), "45 min")
  assert.equal(formatDuration(60), "1 hora")
  assert.equal(formatDuration(240), "4 horas")
  assert.equal(formatDuration(90), "1 h 30 min")
  assert.equal(formatDuration(1440), "24 horas")
})

test("vista pública: textos legibles, precio desde y extras formateados", () => {
  const v = toPublicView(makeActivity({
    priceOptions: [{ label: "Completa", amountCop: 40000, unit: "persona", includes: ["Almuerzo"] }, { label: "Solo caminata", amountCop: 25000, unit: "persona", includes: [] }],
    extras: [{ label: "Con agua", amountCop: 3000, unit: "persona" }],
    companions: ["amigos", "mascotas"], difficulty: "medium", durationMinutes: 240,
    cta: { kind: "whatsappGroup", value: "https://chat.whatsapp.com/x" },
  }))
  assert.equal(v.priceFrom, "Desde $25.000")
  assert.deepEqual(v.prices.map((p) => p.amount), ["$40.000", "$25.000"])
  assert.deepEqual(v.extras, [{ label: "Con agua", amount: "+$3.000", unit: "persona", note: "" }])
  assert.deepEqual([v.categoryName, v.difficulty, v.duration, v.companions], ["Aire libre y aventura", "Dificultad media", "4 horas", ["Con amigos", "Con mascotas"]])
  assert.deepEqual(v.cta, { label: "Unirme al grupo", href: "https://chat.whatsapp.com/x", kind: "whatsappGroup" })
  assert.equal(v.scheduleText, "Todos los domingos · 6:00 a. m.")
})

test("gratis cuando todo cuesta cero", () => {
  assert.equal(toPublicView(makeActivity({ priceOptions: [{ label: "Libre", amountCop: 0, unit: "persona", includes: [] }] })).priceFrom, "Gratis")
})

test("galería: portada primero, sin los medios con error, y el video aparte", () => {
  const v = toPublicView(makeActivity({
    media: [makeImage("b", false), makeImage("a", true), makeImage("x", false, { status: "error" }), { ...makeImage("v", false), type: "video" as const, thumbnailUrl: "https://x.test/vt.jpg" }],
  }))
  assert.deepEqual(v.gallery.map((g) => g.url.split("/").pop()), ["a.jpg", "b.jpg"])
  assert.equal(v.cover?.url.endsWith("a.jpg"), true)
  assert.equal(v.video?.thumbnailUrl, "https://x.test/vt.jpg")
})

test("punto de encuentro según el modo y sin botón cuando no hay", () => {
  assert.equal(toPublicView(makeActivity({ meetingPoint: { mode: "sharedAfterJoining", text: "", references: "", geo: null } })).meeting.note, "El punto de encuentro se comparte en el grupo cuando te unes.")
  assert.equal(toPublicView(makeActivity({ meetingPoint: { mode: "varies", text: "", references: "", geo: null } })).meeting.note, "El punto cambia: se avisa antes de cada salida.")
  const fixed = toPublicView(makeActivity({ meetingPoint: { mode: "fixed", text: "Parque Murillo Toro", references: "Frente a la catedral", geo: null } }))
  assert.deepEqual([fixed.meeting.note, fixed.meeting.text, fixed.meeting.references], [null, "Parque Murillo Toro", "Frente a la catedral"])
  assert.equal(toPublicView(makeActivity()).cta, null)
})

test("la vista no trae datos privados ni fechas (es serializable y cacheable)", () => {
  const v = toPublicView(makeActivity())
  const json = JSON.stringify(v)
  assert.ok(!json.includes("ownerUid") && !json.includes("reviewedBy"))
  assert.doesNotThrow(() => JSON.parse(json))
})

import { toCardView } from "./publicView"
test("tarjeta: datos mínimos, serializables y sin nada privado", () => {
  const c = toCardView(makeActivity({ media: [makeImage("a", true, { thumbnailUrl: "https://x.test/t.jpg" })] }))
  assert.deepEqual([c.title, c.hostName, c.categoryName, c.coverUrl, c.priceFrom], ["Senderismo los domingos", "Club Cerros", "Aire libre y aventura", "https://x.test/t.jpg", "Desde $40.000"])
  assert.equal(c.scheduleText, "Todos los domingos · 6:00 a. m.")
  assert.equal(c.badge, null)
  assert.ok(!JSON.stringify(c).includes("ownerUid"))
})

test("insignia de la tarjeta: en el sitio, gratis o con cita", () => {
  assert.equal(toCardView(makeActivity({ kind: "site", siteId: "s1" })).badge, "En el sitio")
  assert.equal(toCardView(makeActivity({ priceOptions: [{ label: "Libre", amountCop: 0, unit: "persona", includes: [] }] })).badge, "Gratis")
  assert.equal(toCardView(makeActivity({ schedule: { rules: [{ kind: "byAppointment" }], skipDates: [], requiresReservation: true } })).badge, "Con cita")
  assert.equal(toCardView(makeActivity()).coverUrl, "https://x.test/m1.jpg")
  assert.equal(toCardView(makeActivity({ media: [] })).coverUrl, null)
})

test("'N personas fueron' solo desde 10 visitas", () => {
  const label = (visits: number) => toPublicView(makeActivity({ analytics: { views: 0, clicks: 0, visits, reviews: 0, saves: 0 } })).visitedLabel
  assert.equal(label(0), null)
  assert.equal(label(9), null)
  assert.equal(label(10), "10 personas fueron")
  assert.equal(label(1234), "1.234 personas fueron")
})
