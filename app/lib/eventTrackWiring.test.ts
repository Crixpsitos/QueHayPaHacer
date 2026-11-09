import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Guarda del cableado botón→tipo (los componentes necesitan navegador; aquí se comprueba el código).
const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8")

test("'Ver en el mapa' = directions, compartir = share, registro externo pasa por /r/e (lo cuenta el servidor)", () => {
  assert.match(read("presentation/events/components/detail/EventPlace.tsx"), /data-event-track="directions"/)
  assert.match(read("presentation/events/components/EventDetailClient.tsx"), /trackEventAction\(event\.id, type\)/)
  const client = read("presentation/events/components/EventDetailClient.tsx")
  assert.match(client, /eventOutHref\(event\.id, "register"\)/)
  assert.doesNotMatch(client, /window\.open\(event\.externalUrl/) // nunca abrir el destino directo: se perdería el conteo
  assert.doesNotMatch(client, /trackEventAction\(event\.id, "register_external"\)/) // doble conteo
  assert.match(read("presentation/events/components/detail/EventSections.tsx"), /trackEventAction\(event\.id, "share"\)/)
})
