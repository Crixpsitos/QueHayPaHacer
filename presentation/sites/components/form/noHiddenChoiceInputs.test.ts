import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Un <input type="checkbox|radio" class="sr-only"> dentro de un <label> hace que, al tocarlo, el navegador enfoque un
// elemento escondido y desplace un contenedor exterior de la hoja móvil: el formulario de "Mis sitios" se quedaba en
// blanco (bug de "Cómo llegar en bus"). Para casillas/chips se usa <button aria-pressed> o un input visible.
test("el formulario de sitios no usa casillas/radios escondidos con sr-only", () => {
  const dir = __dirname
  const offenders = readdirSync(dir)
    .filter((f) => f.endsWith(".tsx"))
    .filter((f) => /<input[^>]*type=["'](?:checkbox|radio)["'][^>]*className=["'][^"']*\bsr-only\b|<input[^>]*className=["'][^"']*\bsr-only\b[^>]*type=["'](?:checkbox|radio)["']/s.test(readFileSync(join(dir, f), "utf8")))
  assert.deepEqual(offenders, [])
})
