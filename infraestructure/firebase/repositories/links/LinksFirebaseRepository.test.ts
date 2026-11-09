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

function fakeListDb(links: any[], stats: Record<string, Array<{ id: string; clicks: number }>>) {
  const calls: any = { where: [], statsWhere: [] };
  const db = {
    collection: (c: string) => ({
      where: (f: string, op: string, v: any) => {
        calls.where.push([f, op, v]);
        const mine = links.filter((l) => l[f] === v);
        return {
          limit: () => ({ get: async () => ({ docs: mine.map((l) => ({ data: () => l })) }) }),
          count: () => ({ get: async () => ({ data: () => ({ count: mine.length }) }) }),
        };
      },
      doc: (code: string) => ({
        collection: () => ({
          where: (_f: any, op: string, since: string) => {
            calls.statsWhere.push([op, since]);
            return { get: async () => ({ docs: (stats[code] ?? []).filter((s) => s.id >= since).map((s) => ({ id: s.id, data: () => ({ clicks: s.clicks }) })) }) };
          },
        }),
      }),
    }),
  } as any;
  return { db, calls };
}

test("listByOwner: solo los del dueño, con clics desde el día indicado y el más reciente primero", async () => {
  const mk = (code: string, owner: string, ms: number) => ({ code, label: code, target: { type: "event", id: "e" }, ownerUid: owner, active: true, createdAt: { toMillis: () => ms } });
  const f = fakeListDb(
    [mk("AAAAAAA", "u1", 1), mk("BBBBBBB", "u1", 2), mk("CCCCCCC", "u2", 3)],
    { AAAAAAA: [{ id: "2026-10-01", clicks: 99 }, { id: "2026-11-05", clicks: 3 }, { id: "2026-11-09", clicks: 4 }], BBBBBBB: [] },
  );
  const out = await new LinksFirebaseRepository(f.db).listByOwner("u1", "2026-10-10");
  assert.deepEqual(out.map((l) => [l.code, l.clicks]), [["BBBBBBB", 0], ["AAAAAAA", 7]]);
  assert.deepEqual(f.calls.where[0], ["ownerUid", "==", "u1"]);
});

test("countByOwner cuenta sin leer los documentos", async () => {
  const f = fakeListDb([{ code: "AAAAAAA", ownerUid: "u1" }, { code: "BBBBBBB", ownerUid: "u1" }], {});
  assert.equal(await new LinksFirebaseRepository(f.db).countByOwner("u1"), 2);
});
