import test from "node:test";
import assert from "node:assert/strict";
import { createOutHandler } from "./outRedirect";

function setup(over: Partial<Parameters<typeof createOutHandler>[0]> = {}) {
  const recorded: string[] = [];
  const handle = createOutHandler({
    resolve: async (id, to) => (id === "abc" && to === "register" ? "https://tickets.example.com/e1" : null),
    record: async (id, to) => void recorded.push(`${id}:${to}`),
    ipLimit: () => true,
    globalLimit: () => true,
    schedule: (fn) => void fn(), // ponytail: en producción es after()
    ...over,
  });
  const call = (id: string, qs: string, ip = "1.1.1.1") =>
    handle(new Request(`https://yquehaypahacer.com/r/e/${id}${qs}`, { headers: { "x-forwarded-for": ip, "user-agent": "ua" } }), id, new URL(`https://x.com/r${qs}`).searchParams);
  return { call, recorded };
}

test("307 al destino guardado, sin cache, y cuenta una vez", async () => {
  const { call, recorded } = setup();
  const res = await call("abc", "?to=register");
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("location"), "https://tickets.example.com/e1");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(recorded, ["abc:register"]);
});

test("el mismo visitante repetido redirige pero no vuelve a contar", async () => {
  const { call, recorded } = setup();
  await call("abc", "?to=register");
  const res = await call("abc", "?to=register");
  assert.equal(res.status, 307);
  assert.equal(recorded.length, 1);
});

test("sin redirección abierta: ningún valor del query llega a Location y no escribe", async () => {
  const { call, recorded } = setup();
  for (const qs of ["?to=https://malo.com", "?to=", ""]) {
    const res = await call("abc", qs);
    assert.equal(res.status, 404, qs);
    assert.equal(res.headers.get("location"), null, qs);
  }
  const ok = await call("abc", "?to=register&url=https://malo.com");
  assert.equal(ok.headers.get("location"), "https://tickets.example.com/e1");
  assert.equal(recorded.length, 1);
});

test("id inválido o inexistente → 404 sin escritura", async () => {
  const { call, recorded } = setup();
  assert.equal((await call("zzz", "?to=register")).status, 404);
  assert.equal((await call("../etc", "?to=register")).status, 404);
  assert.equal(recorded.length, 0);
});

test("topes por IP o global: redirige igual pero no cuenta", async () => {
  for (const over of [{ ipLimit: () => false }, { globalLimit: () => false }]) {
    const { call, recorded } = setup(over);
    assert.equal((await call("abc", "?to=register")).status, 307);
    assert.equal(recorded.length, 0);
  }
});

test("si contar falla, la persona igual llega a su destino", async () => {
  const { call } = setup({ record: async () => { throw new Error("boom"); } });
  assert.equal((await call("abc", "?to=register")).status, 307);
});
