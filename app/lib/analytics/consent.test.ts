import { test } from "node:test"
import assert from "node:assert/strict"
import { clearConsent, parseConsent, readConsent, saveConsent } from "./consent"

const memoryStore = () => {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}
const brokenStore = {
  getItem: () => { throw new Error("blocked") },
  setItem: () => { throw new Error("blocked") },
  removeItem: () => { throw new Error("blocked") },
}

test("parseConsent solo acepta granted o denied", () => {
  assert.equal(parseConsent("granted"), "granted")
  assert.equal(parseConsent("denied"), "denied")
  for (const bad of [null, undefined, "", "yes", "GRANTED", "true"]) assert.equal(parseConsent(bad), null, String(bad))
})

test("sin decisión guardada devuelve null", () => {
  assert.equal(readConsent(memoryStore()), null)
})

test("guardar y leer la decisión", () => {
  const store = memoryStore()
  saveConsent("granted", store)
  assert.equal(readConsent(store), "granted")
  saveConsent("denied", store)
  assert.equal(readConsent(store), "denied")
})

test("clearConsent borra la decisión (para volver a preguntar)", () => {
  const store = memoryStore()
  saveConsent("granted", store)
  clearConsent(store)
  assert.equal(readConsent(store), null)
})

test("si el almacenamiento está bloqueado no lanza y se comporta como sin decisión", () => {
  assert.equal(readConsent(brokenStore), null)
  assert.doesNotThrow(() => saveConsent("granted", brokenStore))
  assert.doesNotThrow(() => clearConsent(brokenStore))
})
