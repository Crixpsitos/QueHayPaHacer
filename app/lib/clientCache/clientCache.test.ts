import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClientCache, type CacheBackend } from "./clientCache";

const m = new Map<string, unknown>();
const backend: CacheBackend = {
  get: async (k) => m.get(k),
  set: async (k, v) => void m.set(k, v),
  delete: async (k) => void m.delete(k),
  keys: async () => [...m.keys()],
};
const c = createClientCache(backend);

describe("clientCache", () => {
  beforeEach(() => m.clear());

  it("devuelve lo guardado para el mismo uid", async () => {
    await c.writeCache("a", "u1", { x: 1 }, 1000);
    assert.deepEqual((await c.readCache("a", "u1", 5000, 2000))?.data, { x: 1 });
  });
  it("otro uid no lo lee", async () => {
    await c.writeCache("a", "u1", 1, 1000);
    assert.equal(await c.readCache("a", "u2", 5000, 2000), null);
    assert.equal(await c.readCache("a", null, 5000, 2000), null);
  });
  it("vencido no se devuelve", async () => {
    await c.writeCache("a", "u1", 1, 1000);
    assert.equal(await c.readCache("a", "u1", 500, 2000), null);
  });
  it("valor corrupto = sin caché", async () => {
    m.set("v1:a", "no soy una entrada");
    assert.equal(await c.readCache("a", "u1", 5000), null);
  });
  it("clearClientCache borra solo lo de la app", async () => {
    await c.writeCache("a", "u1", 1);
    m.set("otra-cosa", 1);
    await c.clearClientCache();
    assert.equal(await c.readCache("a", "u1", 5000), null);
    assert.equal(m.get("otra-cosa"), 1);
  });
  it("un backend que falla no rompe nada", async () => {
    const boom = createClientCache({ get: async () => { throw new Error("x"); }, set: async () => { throw new Error("x"); }, delete: async () => { throw new Error("x"); }, keys: async () => { throw new Error("x"); } });
    assert.equal(await boom.readCache("a", "u", 1), null);
    await boom.writeCache("a", "u", 1);
    await boom.clearClientCache();
  });
  it("updateCache en serie no pierde actualizaciones", async () => {
    await Promise.all([1, 2, 3, 4, 5].map((n) => c.updateCache<number[]>("l", "u1", 1e9, (p) => [...(p ?? []), n])));
    assert.deepEqual((await c.readCache<number[]>("l", "u1", 1e9))?.data.sort(), [1, 2, 3, 4, 5]);
  });
});

describe("invalidateMyData", () => {
  it("borra my-profile, my-events y preference-events y respeta el resto", async () => {
    for (const k of ["my-profile", "my-events", "preference-events", "likes:events"]) await c.writeCache(k, "u1", 1);
    await c.invalidateMyData();
    for (const k of ["my-profile", "my-events", "preference-events"]) assert.equal(await c.readCache(k, "u1", 1e9), null, k);
    assert.equal((await c.readCache("likes:events", "u1", 1e9))?.data, 1);
  });
});
