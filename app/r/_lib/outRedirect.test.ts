import test from "node:test";
import assert from "node:assert/strict";
import { createOutHandler } from "./outRedirect";

function setup(over: Partial<Parameters<typeof createOutHandler>[0]> = {}) {
  const recorded: string[] = [];
  const handle = createOutHandler({
    resolve: async (id, to) => (id === "abc" && to === "register" ? "https://tickets.example.com/e1" : null),
    record: async (id, to) => void recorded.push(`${id}:${to}`),
    ipLimit: () => true,
    readLimit: () => true,
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

test("HEAD (vistas previas, comprobadores de enlaces) redirige pero no cuenta como clic", async () => {
  const recorded: string[] = [];
  const handle = createOutHandler({
    resolve: async () => "https://tickets.example.com/e1",
    record: async (id, to) => void recorded.push(`${id}:${to}`),
    ipLimit: () => true,
    readLimit: () => true,
    globalLimit: () => true,
    schedule: (fn) => void fn(),
  });
  const res = await handle(new Request("https://yquehaypahacer.com/r/e/abc?to=register", { method: "HEAD" }), "abc", new URLSearchParams("to=register"));
  assert.equal(res.status, 307);
  assert.equal(recorded.length, 0);
});

test("lecturas acotadas: el mismo destino se resuelve una vez por minuto (también los 404)", async () => {
  let reads = 0, t = 0;
  const handle = createOutHandler({
    resolve: async (id) => (reads++, id === "abc" ? "https://tickets.example.com/e1" : null),
    record: async () => {},
    ipLimit: () => true,
    readLimit: () => true,
    globalLimit: () => true,
    schedule: (fn) => void fn(),
    now: () => t,
  });
  const go = (id: string) => handle(new Request(`https://x.co/r/e/${id}?to=register`), id, new URLSearchParams("to=register"));
  await go("abc"); await go("abc"); await go("nope"); await go("nope");
  assert.equal(reads, 2);
  t = 61_000;
  await go("abc");
  assert.equal(reads, 3);
});

test("barrido de ids: tras el tope de lecturas por IP, los desconocidos dan 429 sin leer la base; los ya resueltos siguen redirigiendo", async () => {
  let reads = 0, allowed = 1;
  const handle = createOutHandler({
    resolve: async (id) => (reads++, id === "abc" ? "https://tickets.example.com/e1" : null),
    record: async () => {},
    ipLimit: () => true,
    readLimit: () => allowed-- > 0,
    globalLimit: () => true,
    schedule: (fn) => void fn(),
  });
  const go = (id: string) => handle(new Request(`https://x.co/r/e/${id}?to=register`), id, new URLSearchParams("to=register"));
  assert.equal((await go("abc")).status, 307); // gasta el único permiso de lectura
  const before = reads;
  assert.equal((await go("otro1")).status, 429);
  assert.equal((await go("otro2")).status, 429);
  assert.equal(reads, before);
  assert.equal((await go("abc")).status, 307); // en caché: no necesita permiso
});
