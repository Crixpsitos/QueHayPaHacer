import test from "node:test";
import assert from "node:assert/strict";
import { LinksFirebaseRepository } from "./LinksFirebaseRepository";

function fakeDb(data: Record<string, any> = {}) {
  const ops: Array<{ op: string; path: string; data?: any; opts?: any }> = [];
  const doc = (path: string): any => ({
    path,
    create: async (d: any) => { if (path in data) throw Object.assign(new Error("exists"), { code: 6 }); ops.push({ op: "create", path, data: d }); data[path] = d; },
    set: async (d: any, opts: any) => void ops.push({ op: "set", path, data: d, opts }),
    get: async () => ({ exists: path in data, id: path.split("/").pop(), data: () => data[path] }),
    collection: (c: string) => ({ doc: (d: string) => doc(`${path}/${c}/${d}`) }),
  });
  return { ops, db: { collection: (c: string) => ({ doc: (d: string) => doc(`${c}/${d}`) }) } as any };
}

test("create: usa create() (no pisa un código existente) y guarda solo los campos del enlace", async () => {
  const f = fakeDb();
  const repo = new LinksFirebaseRepository(f.db);
  await repo.create({ code: "aB3xY9Z", label: "IG", target: { type: "event", id: "ev1" }, ownerUid: "u1" });
  assert.equal(f.ops[0].op, "create");
  assert.equal(f.ops[0].path, "links/aB3xY9Z");
  assert.deepEqual(Object.keys(f.ops[0].data).sort(), ["active", "code", "createdAt", "label", "ownerUid", "target"]);
  await assert.rejects(repo.create({ code: "aB3xY9Z", label: "x", target: { type: "event", id: "e" }, ownerUid: "u" }), (e: any) => e.code === 6);
});

test("findByCode: devuelve el enlace o null", async () => {
  const f = fakeDb({ "links/aB3xY9Z": { code: "aB3xY9Z", label: "IG", target: { type: "site", id: "s1" }, ownerUid: "u1", active: true, createdAt: 1 } });
  const repo = new LinksFirebaseRepository(f.db);
  assert.deepEqual(await repo.findByCode("aB3xY9Z"), { code: "aB3xY9Z", label: "IG", target: { type: "site", id: "s1" }, ownerUid: "u1", active: true });
  assert.equal(await repo.findByCode("nope000"), null);
});

test("recordClick: suma 1 al doc diario del enlace con merge (no toca el doc del enlace)", async () => {
  const f = fakeDb();
  await new LinksFirebaseRepository(f.db).recordClick("aB3xY9Z", "2026-11-09");
  assert.equal(f.ops[0].op, "set");
  assert.equal(f.ops[0].path, "links/aB3xY9Z/stats/2026-11-09");
  assert.deepEqual(f.ops[0].opts, { merge: true });
  assert.equal(f.ops[0].data.day, "2026-11-09");
  assert.ok("clicks" in f.ops[0].data);
});
