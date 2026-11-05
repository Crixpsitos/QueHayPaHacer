import { test } from "node:test"
import assert from "node:assert/strict"
import { decideRetry } from "./decideRetry"

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
