import { test } from "node:test"
import assert from "node:assert/strict"
import { makeActivity, makeImage } from "@/domain/entities/activities/activity.fixture"
import { activityStatus, toMySummary } from "./activityStatus"

test("estado visible para el creador según publicación, moderación y pausa", () => {
  assert.equal(activityStatus(makeActivity({ publicationStatus: "draft", moderationStatus: "pending" })).key, "draft")
  assert.equal(activityStatus(makeActivity({ moderationStatus: "pending" })).key, "review")
  assert.equal(activityStatus(makeActivity({ moderationStatus: "rejected" })).key, "rejected")
  assert.equal(activityStatus(makeActivity()).key, "live")
  assert.equal(activityStatus(makeActivity({ isActive: false })).key, "paused")
})

test("cada estado trae etiqueta y una frase que explica qué pasa", () => {
  for (const a of [makeActivity({ publicationStatus: "draft" }), makeActivity({ moderationStatus: "pending" }), makeActivity({ moderationStatus: "rejected" }), makeActivity(), makeActivity({ isActive: false })]) {
    const s = activityStatus(a)
    assert.ok(s.label.length > 0 && s.help.length > 10)
  }
})

test("rechazada muestra el motivo si lo hay", () => {
  assert.match(activityStatus(makeActivity({ moderationStatus: "rejected", rejectionReason: "Fotos de otra persona" })).help, /Fotos de otra persona/)
})

test("toMySummary es serializable y trae portada, horario legible y qué acciones hay", () => {
  const a = makeActivity({ id: "x1", media: [makeImage("m1", false), makeImage("m2", true, { thumbnailUrl: "https://x.test/t.jpg" })] })
  const s = toMySummary(a)
  assert.equal(s.id, "x1")
  assert.equal(s.coverUrl, "https://x.test/t.jpg")
  assert.equal(s.schedule, "Todos los domingos · 6:00 a. m.")
  assert.equal(s.canToggleActive, true)
  assert.doesNotThrow(() => JSON.stringify(s))
  assert.equal(toMySummary(makeActivity({ publicationStatus: "draft" })).canToggleActive, false) // solo se pausa lo publicado y aprobado
  assert.equal(toMySummary(makeActivity({ moderationStatus: "pending" })).canToggleActive, false)
  assert.equal(toMySummary(makeActivity({ media: [] })).coverUrl, null)
})
