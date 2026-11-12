import test from "node:test";
import assert from "node:assert/strict";
import { createActivityTrackHandler } from "./eventTrack";

function setup(over: { globalOk?: boolean } = {}) {
  const calls: unknown[][] = [];
  const handle = createActivityTrackHandler({
    record: async (...a) => void calls.push(a),
    day: () => "2026-11-10",
    ipLimit: () => true,
    globalLimit: () => over.globalOk ?? true,
  });
  return { calls, handle };
}
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://x/api/activities/a1/track", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "sec-fetch-site": "same-origin", "x-forwarded-for": "9.9.9.9", "user-agent": "t", ...headers },
  });

test("vista por canal: 204 y una escritura con el origen", async () => {
  const { calls, handle } = setup();
  const r = await handle(req({ type: "view", src: "ch:wa" }), "a1");
  assert.equal(r.status, 204);
  assert.deepEqual(calls, [["a1", "view", "2026-11-10", "ch:wa"]]);
});

test("acepta directions, cta y share; rechaza tipos de evento y basura", async () => {
  const { calls, handle } = setup();
  for (const type of ["directions", "cta", "share"]) assert.equal((await handle(req({ type }), "a1")).status, 204);
  assert.equal(calls.length, 3);
  for (const type of ["website", "register_external", "x"]) assert.equal((await handle(req({ type }), "a1")).status, 400);
  assert.equal((await handle(req({ type: "view" }), "../etc")).status, 400);
});

test("no same-origin: 204 y 0 escrituras", async () => {
  const { calls, handle } = setup();
  const r = await handle(req({ type: "view" }, { "sec-fetch-site": "cross-site" }), "a1");
  assert.equal(r.status, 204);
  assert.equal(calls.length, 0);
});

test("repetido el mismo día = 1 escritura; tope global descarta", async () => {
  const a = setup();
  await a.handle(req({ type: "view" }), "a1");
  await a.handle(req({ type: "view" }), "a1");
  assert.equal(a.calls.length, 1);
  const b = setup({ globalOk: false });
  await b.handle(req({ type: "view" }), "a1");
  assert.equal(b.calls.length, 0);
});
