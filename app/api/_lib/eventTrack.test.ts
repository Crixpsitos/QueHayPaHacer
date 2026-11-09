import test from "node:test";
import assert from "node:assert/strict";
import { createEventTrackHandler } from "./eventTrack";

function setup(over: { globalOk?: boolean } = {}) {
  const calls: unknown[][] = [];
  const handle = createEventTrackHandler({
    record: async (...a) => void calls.push(a),
    day: () => "2026-11-09",
    ipLimit: () => true,
    globalLimit: () => over.globalOk ?? true,
  });
  return { calls, handle };
}
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://x/api/events/ev1/track", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", "x-forwarded-for": "9.9.9.9", "user-agent": "t", ...headers },
  });

test("vista válida: 204 y una escritura con el origen", async () => {
  const { calls, handle } = setup();
  const r = await handle(req({ type: "view", src: "instagram" }), "ev1");
  assert.equal(r.status, 204);
  assert.deepEqual(calls, [["ev1", "view", "2026-11-09", "instagram"]]);
});

test("sin src = direct", async () => {
  const { calls, handle } = setup();
  await handle(req({ type: "view" }), "ev1");
  assert.equal(calls[0][3], "direct");
});

test("no same-origin: 204 y 0 escrituras", async () => {
  const { calls, handle } = setup();
  const r = await handle(req({ type: "view" }, { "sec-fetch-site": "cross-site" }), "ev1");
  assert.equal(r.status, 204);
  assert.equal(calls.length, 0);
});

test("cuerpo > 1 KB: 204 y 0 escrituras", async () => {
  const { calls, handle } = setup();
  const r = await handle(req({ type: "view", pad: "x".repeat(2000) }), "ev1");
  assert.equal(r.status, 204);
  assert.equal(calls.length, 0);
});

test("type inválido o id inválido: 400 y 0 escrituras", async () => {
  const { calls, handle } = setup();
  assert.equal((await handle(req({ type: "like" }), "ev1")).status, 400);
  assert.equal((await handle(req({ type: "view" }), "../x")).status, 400);
  assert.equal(calls.length, 0);
});

test("repetido el mismo día: 204 y una sola escritura", async () => {
  const { calls, handle } = setup();
  await handle(req({ type: "view" }), "ev1");
  const r = await handle(req({ type: "view" }), "ev1");
  assert.equal(r.status, 204);
  assert.equal(calls.length, 1);
});

test("tope global superado: 204 y 0 escrituras", async () => {
  const { calls, handle } = setup({ globalOk: false });
  const r = await handle(req({ type: "view" }), "ev1");
  assert.equal(r.status, 204);
  assert.equal(calls.length, 0);
});

test("error del repositorio no rompe la respuesta", async () => {
  const handle = createEventTrackHandler({ record: async () => { throw new Error("db"); }, day: () => "d", ipLimit: () => true, globalLimit: () => true });
  assert.equal((await handle(req({ type: "view" }), "ev1")).status, 204);
});
