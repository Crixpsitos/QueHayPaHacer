import { test } from "node:test"
import assert from "node:assert/strict"
import { firstEventViewOfDay, landingSource } from "./eventTrack"

const memory = () => {
  const d = new Map<string, string>()
  return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v) }
}

test("firstEventViewOfDay: una vista por evento y día; otro evento o día cuenta aparte", () => {
  const s = memory()
  assert.equal(firstEventViewOfDay("a", "2026-11-09", s), true)
  assert.equal(firstEventViewOfDay("a", "2026-11-09", s), false)
  assert.equal(firstEventViewOfDay("b", "2026-11-09", s), true)
  assert.equal(firstEventViewOfDay("a", "2026-11-10", s), true)
})

test("firstEventViewOfDay: almacenamiento bloqueado = cuenta (el servidor acota)", () => {
  const broken = { getItem: () => { throw new Error("x") }, setItem: () => { throw new Error("x") } }
  assert.equal(firstEventViewOfDay("a", "d", broken), true)
})

test("landingSource: se fija al aterrizar y no cambia al navegar dentro del sitio", () => {
  const s = memory()
  assert.equal(landingSource({ href: "https://yquehaypahacer.com/eventos?utm_source=ig", referrer: "" }, s), "instagram")
  // navegación interna: ya no hay utm y el referrer es propio
  assert.equal(landingSource({ href: "https://yquehaypahacer.com/eventos/x", referrer: "https://yquehaypahacer.com/eventos" }, s), "instagram")
})

test("landingSource: usa referrer y el parámetro qr", () => {
  assert.equal(landingSource({ href: "https://yquehaypahacer.com/", referrer: "https://l.facebook.com/" }, memory()), "facebook")
  assert.equal(landingSource({ href: "https://yquehaypahacer.com/eventos/x?qr=aB3dE5g", referrer: "" }, memory()), "link:aB3dE5g")
  assert.equal(landingSource({ href: "https://yquehaypahacer.com/", referrer: "" }, memory()), "direct")
})
