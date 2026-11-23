import assert from "node:assert/strict"
import { test } from "node:test"
import { normalizeHttpUrl, normalizeHttpUrlOrKeep } from "./normalizeHttpUrl"

test("completa https:// cuando falta", () => {
  assert.equal(normalizeHttpUrl("ejemplo.com/registro"), "https://ejemplo.com/registro")
  assert.equal(normalizeHttpUrl("  www.ejemplo.co  "), "https://www.ejemplo.co/")
  assert.equal(normalizeHttpUrl("ejemplo.com:8080/x"), "https://ejemplo.com:8080/x")
})

test("respeta http y https escritos", () => {
  assert.equal(normalizeHttpUrl("https://a.com/x?y=1"), "https://a.com/x?y=1")
  assert.equal(normalizeHttpUrl("http://a.com"), "http://a.com/")
})

test("rechaza esquemas peligrosos, credenciales, espacios y dominios sin punto", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "mailto:a@b.com", "ftp://a.com", "https://user:pw@a.com", "hola mundo.com", "localhost", "https://a", "", "   ", "..com", "//evil.com", "/ruta"]) {
    assert.equal(normalizeHttpUrl(bad), null, bad)
  }
})

test("normalizeHttpUrlOrKeep deja intacto lo inválido y lo vacío", () => {
  assert.equal(normalizeHttpUrlOrKeep("a.com"), "https://a.com/")
  assert.equal(normalizeHttpUrlOrKeep("javascript:x"), "javascript:x")
  assert.equal(normalizeHttpUrlOrKeep(""), "")
})
