import { test } from "node:test"
import assert from "node:assert/strict"
import { decideRetry, canRetryNow, RETRY_COOLDOWN_MS } from "./decideRetry"

const item = (status: string, path?: string, id = "m1") => ({ id, data: { status, path } })
const P = "public/events/E1/images/deoptimized-media-foto.jpg-uuid"

test("item en processing con original válido: reescribir ese original", () => {
  assert.deepEqual(decideRetry("E1", [item("processing", P)], "m1"), { kind: "rewrite", path: P })
})

test("item en error también se puede reintentar", () => {
  assert.deepEqual(decideRetry("E1", [item("error", P)], "m1"), { kind: "rewrite", path: P })
})

test("item ya ready: no hace nada (idempotente)", () => {
  assert.deepEqual(decideRetry("E1", [item("ready", P)], "m1"), { kind: "already-ready" })
})

test("item inexistente en el evento", () => {
  assert.deepEqual(decideRetry("E1", [item("processing", P)], "otro"), { kind: "not-found" })
})

test("sin path guardado no hay original que reprocesar", () => {
  assert.deepEqual(decideRetry("E1", [item("processing", undefined)], "m1"), { kind: "bad-path" })
})

test("rechaza paths fuera de la carpeta del evento (no reescribir objetos ajenos)", () => {
  for (const bad of [
    "public/events/OTRO/images/x.jpg",
    "public/sites/E1/images/x.jpg",
    "public/events/E1/../OTRO/images/x.jpg",
    "private/events/E1/images/x.jpg",
  ]) {
    assert.deepEqual(decideRetry("E1", [item("processing", bad)], "m1"), { kind: "bad-path" }, bad)
  }
})

test("no reintenta los archivos ya optimizados (optimized_*) para no crear bucles", () => {
  assert.deepEqual(decideRetry("E1", [item("processing", "public/events/E1/images/optimized_foto.webp")], "m1"), { kind: "bad-path" })
})

test("solo reescribe originales deoptimized-* (no miniaturas ni otros archivos de la carpeta)", () => {
  for (const bad of [
    "public/events/E1/images/foto.jpg",
    "public/events/E1/images/thumb_foto.jpg",
    "public/events/E1/images/optimized_foto_thumbnail.jpg",
  ]) {
    assert.deepEqual(decideRetry("E1", [item("processing", bad)], "m1"), { kind: "bad-path" }, bad)
  }
})

test("rechaza barras invertidas y segmentos vacíos en el path", () => {
  for (const bad of ["public/events/E1/images\\deoptimized-x", "public/events/E1//images/deoptimized-x"]) {
    assert.deepEqual(decideRetry("E1", [item("processing", bad)], "m1"), { kind: "bad-path" }, bad)
  }
})

test("enfriamiento: no reintenta si el objeto cambió hace menos de 2 min", () => {
  assert.equal(canRetryNow(30_000), false)
  assert.equal(canRetryNow(RETRY_COOLDOWN_MS - 1), false)
  assert.equal(canRetryNow(RETRY_COOLDOWN_MS), true)
})

// ── Sesiones: originales en public/sessions/{sid}/media/session-{sid}-media-<nombre>-<uuid> ──
const S = { folder: "public/sessions/S1/media/", namePrefix: "session-S1-media-" }
const SP = "public/sessions/S1/media/session-S1-media-foto.jpg-uuid"

test("sesión: reescribe el original de la galería de ESA sesión", () => {
  assert.deepEqual(decideRetry("E1", [item("processing", SP)], "m1", S), { kind: "rewrite", path: SP })
})

test("sesión: rechaza archivos de otra sesión, optimizados o fuera de /media", () => {
  for (const bad of [
    "public/sessions/OTRA/media/session-OTRA-media-foto.jpg-uuid",
    "public/sessions/S1/media/optimized_session-S1-media-foto.webp",
    "public/sessions/S1/session-S1-main-portada.jpg-uuid",
    "public/events/E1/images/deoptimized-media-foto.jpg-uuid",
  ]) {
    assert.deepEqual(decideRetry("E1", [item("processing", bad)], "m1", S), { kind: "bad-path" }, bad)
  }
})

test("sesión: un item ya ready no se toca", () => {
  assert.deepEqual(decideRetry("E1", [item("ready", SP)], "m1", S), { kind: "already-ready" })
})
