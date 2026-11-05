import { test } from "node:test"
import assert from "node:assert/strict"
import { createAnalytics, type AnalyticsSdk } from "./client"

type Call = [string, ...unknown[]]

function fakeSdk(opts: { supported?: boolean; throwOnLog?: boolean } = {}) {
  const calls: Call[] = []
  const sdk: AnalyticsSdk = {
    isSupported: async () => opts.supported ?? true,
    initializeAnalytics: (_app, options) => (calls.push(["init", options]), "instance"),
    setConsent: (s) => void calls.push(["consent", s]),
    logEvent: (_a, name, params) => {
      if (opts.throwOnLog) throw new Error("boom")
      calls.push(["log", name, params])
    },
    setUserProperties: (_a, p) => void calls.push(["props", p]),
  }
  let loads = 0
  const make = (measurementId: string | null = "G-TEST") =>
    createAnalytics({ measurementId: measurementId ?? undefined, getApp: () => ({}), loadSdk: async () => (loads++, sdk) })
  return { calls, make, loads: () => loads }
}

const names = (calls: Call[]) => calls.map((c) => c[0])

test("sin measurementId no hace nada ni carga el SDK", async () => {
  const t = fakeSdk()
  const a = t.make(null)
  a.track("like", { item_id: "x" })
  a.pageView("https://qhpa.test/eventos/abc")
  await a.flush()
  assert.equal(t.loads(), 0)
  assert.deepEqual(t.calls, [])
})

test("navegador sin soporte: no inicializa ni envía", async () => {
  const t = fakeSdk({ supported: false })
  const a = t.make()
  a.track("like", { item_id: "x" })
  await a.flush()
  assert.deepEqual(t.calls, [])
})

test("consentimiento por defecto denegado ANTES de inicializar, sin page_view automático", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.track("like", { item_id: "x" })
  await a.flush()
  assert.deepEqual(names(t.calls).slice(0, 2), ["consent", "init"])
  assert.equal((t.calls[0][1] as Record<string, string>).analytics_storage, "denied")
  assert.equal((t.calls[1][1] as { config: Record<string, unknown> }).config.send_page_view, false)
})

test("si ya había aceptado, el consentimiento inicial es granted", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.setConsent(true)
  a.track("like", { item_id: "x" })
  await a.flush()
  assert.equal((t.calls[0][1] as Record<string, string>).analytics_storage, "granted")
})

test("aceptar después de inicializar manda la actualización", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.track("like", { item_id: "x" })
  await a.flush()
  a.setConsent(true)
  const last = t.calls.at(-1)!
  assert.equal(last[0], "consent")
  assert.equal((last[1] as Record<string, string>).analytics_storage, "granted")
})

test("track elimina parámetros no permitidos (uid, correo)", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.track("share", { method: "whatsapp", uid: "u1", email: "a@b.co" })
  await a.flush()
  const log = t.calls.find((c) => c[0] === "log")!
  assert.deepEqual(log[2], { method: "whatsapp" })
})

test("pageView: ruta pública envía page_view con ubicación limpia; privada no envía", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.pageView("https://qhpa.test/studio/events/1")
  a.pageView("https://qhpa.test/eventos/abc?utm_source=facebook&token=secreto")
  await a.flush()
  const logs = t.calls.filter((c) => c[0] === "log")
  assert.equal(logs.length, 1)
  assert.equal(logs[0][1], "page_view")
  assert.deepEqual(logs[0][2], {
    page_location: "https://qhpa.test/eventos/abc?utm_source=facebook",
    page_path: "/eventos/abc",
  })
})

test("login_state se manda como propiedad de usuario y los eventos previos esperan a la carga", async () => {
  const t = fakeSdk()
  const a = t.make()
  a.track("like", { item_id: "x" })
  a.setLoginState("logged_in")
  await a.flush()
  assert.deepEqual(t.calls.find((c) => c[0] === "props")![1], { login_state: "logged_in" })
  assert.ok(names(t.calls).indexOf("init") < names(t.calls).indexOf("log"))
})

test("un SDK que falla no rompe la página", async () => {
  const t = fakeSdk({ throwOnLog: true })
  const a = t.make()
  a.track("like", { item_id: "x" })
  await assert.doesNotReject(a.flush())
})
