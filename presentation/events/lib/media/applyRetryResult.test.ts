import { test } from "node:test"
import assert from "node:assert/strict"
import { applyRetryResult } from "./applyRetryResult"
import type { MediaItem } from "@/application/dto/events/EventDto"

const item = (id: string, status: "processing" | "ready" | "error"): MediaItem =>
  ({ id, type: "image", data: { url: `u-${id}`, path: `p-${id}`, status } }) as MediaItem

function run(result: Parameters<typeof applyRetryResult>[0]["result"], media: MediaItem[]) {
  const calls: string[] = []
  let current = media
  applyRetryResult({
    result,
    mediaId: "a",
    media,
    setMedia: (m) => { current = m; calls.push("set") },
    notify: { success: (m) => calls.push(`ok:${m}`), error: (m) => calls.push(`err:${m}`) },
  })
  return { calls, current }
}

test("ya estaba listo: reemplaza el item del formulario por el guardado", () => {
  const stored = item("a", "ready")
  const { current, calls } = run({ success: true, status: "already-ready", item: stored }, [item("a", "processing"), item("b", "processing")])
  assert.deepEqual(current.map((m) => [m.id, (m.data as { status?: string }).status]), [["a", "ready"], ["b", "processing"]])
  assert.ok(calls.some((c) => c.startsWith("ok:")))
})

test("reintento lanzado: no toca el formulario y avisa", () => {
  const { current, calls } = run({ success: true, status: "retriggered" }, [item("a", "processing")])
  assert.equal((current[0].data as { status?: string }).status, "processing")
  assert.deepEqual(calls.filter((c) => c === "set"), [])
  assert.ok(calls.some((c) => c.startsWith("ok:")))
})

test("falta el original: deja el item en error para que el usuario lo elimine y avisa", () => {
  const { current, calls } = run({ success: false, code: "missing-original", error: "vuelve a subirlo" }, [item("a", "processing"), item("b", "processing")])
  assert.deepEqual(current.map((m) => (m.data as { status?: string }).status), ["error", "processing"])
  assert.ok(calls.includes("err:vuelve a subirlo"))
})

test("otro error (enfriamiento, permiso): solo avisa, no cambia el formulario", () => {
  const { current, calls } = run({ success: false, code: "failed", error: "Espera un par de minutos." }, [item("a", "processing")])
  assert.equal((current[0].data as { status?: string }).status, "processing")
  assert.deepEqual(calls, ["err:Espera un par de minutos."])
})
