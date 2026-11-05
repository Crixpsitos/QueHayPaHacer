import { test } from "node:test"
import assert from "node:assert/strict"
import { isRetryable, RETRY_AFTER_MS } from "./isRetryable"

const T0 = 1_000_000

test("processing recién visto: todavía no se puede reintentar", () => {
  assert.equal(isRetryable("processing", T0, T0 + 1000), false)
})

test("processing por 3 min o más: se puede reintentar", () => {
  assert.equal(isRetryable("processing", T0, T0 + RETRY_AFTER_MS), true)
  assert.equal(isRetryable("processing", T0, T0 + RETRY_AFTER_MS - 1), false)
})

test("error se puede reintentar de inmediato", () => {
  assert.equal(isRetryable("error", T0, T0), true)
})

test("ready nunca", () => {
  assert.equal(isRetryable("ready", T0, T0 + 10 * RETRY_AFTER_MS), false)
})

test("sin estado o sin hora de referencia no reintenta", () => {
  assert.equal(isRetryable(undefined, T0, T0 + 10 * RETRY_AFTER_MS), false)
  assert.equal(isRetryable("processing", undefined, T0), false)
})
