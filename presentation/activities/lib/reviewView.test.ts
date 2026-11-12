import { test } from "node:test"
import assert from "node:assert/strict"
import { filterReviews, reviewKey, toReviewView, visitedLabel } from "./reviewView"
import type { ActivityReview } from "@/domain/entities/activities/review/ActivityReview"

const base: ActivityReview = {
  id: "act1_uid-secreto", activityId: "act1", uid: "uid-secreto", rating: 5, title: "Muy buena", body: "Salimos temprano.", visitedAt: "2026-10",
  media: [
    { id: "i1", type: "image", path: "p/1", url: "https://x/1.jpg", thumbnailUrl: "https://x/1t.jpg", width: 10, height: 10, alt: "Sendero", isCover: true, status: "ready" },
    { id: "i2", type: "image", path: "p/2", url: "https://x/2.jpg", width: 10, height: 10, alt: "", isCover: false, status: "processing" },
    { id: "v1", type: "video", path: "p/v", url: "https://x/v.mp4", thumbnailUrl: "https://x/vt.jpg", width: 10, height: 10, alt: "", isCover: false, status: "ready" },
  ],
  coverIndex: 0, author: { uid: "uid-secreto", displayName: "Ana P.", photoURL: "https://x/a.jpg" }, status: "published", flag: null, ownerReply: null,
  createdAt: new Date("2026-11-03T15:00:00Z"), updatedAt: new Date("2026-11-03T15:00:00Z"), editedAt: null, declarationVersion: "2026-11-12",
}

test("la vista pública NO lleva el uid ni el id del documento; la clave es opaca y estable", () => {
  const v = toReviewView(base)
  const json = JSON.stringify(v)
  assert.ok(!json.includes("uid-secreto"))
  assert.ok(!json.includes("act1_"))
  assert.equal(v.key, reviewKey("act1", "uid-secreto"))
  assert.notEqual(reviewKey("act1", "otro"), v.key)
})

test("solo muestra medios listos; el video aparte; «procesando» se indica", () => {
  const v = toReviewView(base)
  assert.deepEqual(v.photos.map((p) => p.url), ["https://x/1t.jpg"])
  assert.equal(v.video?.url, "https://x/v.mp4")
  assert.equal(v.processingMedia, true)
})

test("etiquetas en español: mes de la visita y fecha", () => {
  assert.equal(visitedLabel("2026-10"), "octubre de 2026")
  assert.equal(toReviewView(base).createdLabel, "3 de noviembre de 2026")
})

test("estados: en verificación y verificada por QHPA", () => {
  assert.equal(toReviewView({ ...base, status: "flagged", flag: { by: "x", reason: "spam", note: "", at: new Date() } }).inVerification, true)
  assert.equal(toReviewView({ ...base, flag: { by: "x", reason: "spam", note: "", at: new Date(), resolution: "upheld" } }).verifiedByQhpa, true)
  assert.equal(toReviewView(base).verifiedByQhpa, false)
})

test("filtros: con fotos, por estrellas, recientes primero", () => {
  const a = toReviewView(base)
  const b = toReviewView({ ...base, id: "act1_u2", uid: "u2", rating: 3, media: [], createdAt: new Date("2026-11-05T15:00:00Z") })
  assert.deepEqual(filterReviews([a, b], "photos").map((r) => r.rating), [5])
  assert.deepEqual(filterReviews([a, b], "5").map((r) => r.rating), [5])
  assert.deepEqual(filterReviews([a, b], "recent").map((r) => r.rating), [3, 5])
  assert.equal(filterReviews([a, b], "all").length, 2)
})
