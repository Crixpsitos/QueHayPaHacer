import test from "node:test";
import assert from "node:assert/strict";
import { DailyStatsFirebaseRepository } from "./DailyStatsFirebaseRepository";

function fakeDb(stats: Record<string, Array<{ id: string; data: any }>>) {
  const reads: string[] = [];
  return {
    reads,
    db: {
      collection: (c: string) => ({
        doc: (id: string) => ({
          collection: () => ({
            where: (_f: any, _op: string, since: string) => ({
              get: async () => (reads.push(`${c}/${id}>=${since}`), { docs: (stats[`${c}/${id}`] ?? []).filter((d) => d.id >= since).map((d) => ({ data: () => d.data })) }),
            }),
          }),
        }),
      }),
    } as any,
  };
}

test("sumSince: lee los días desde la fecha y devuelve los totales", async () => {
  const f = fakeDb({ "events/e1": [{ id: "2026-10-01", data: { views: 99 } }, { id: "2026-11-02", data: { views: 5, clicks: 1, bySource: { instagram: 6 } } }, { id: "2026-11-09", data: { views: 2, bySource: { direct: 2 } } }] });
  const out = await new DailyStatsFirebaseRepository(f.db).sumSince("events", "e1", "2026-10-10");
  assert.deepEqual(out, { views: 7, clicks: 1, bySource: { instagram: 6, direct: 2 }, viewsBy: {}, linkClicks: {}, byType: {} });
});

test("sumSince: solo events o sites y ids seguros (nada de rutas arbitrarias)", async () => {
  const f = fakeDb({});
  const repo = new DailyStatsFirebaseRepository(f.db);
  await assert.rejects(repo.sumSince("users" as never, "e1", "2026-10-10"));
  await assert.rejects(repo.sumSince("events", "../x", "2026-10-10"));
  assert.equal(f.reads.length, 0);
});

test("recordLinkClick: suma 1 a linkClicks.<canal> del doc diario (merge) y valida entrada", async () => {
  const ops: any[] = [];
  const db = { collection: (c: string) => ({ doc: (id: string) => ({ collection: () => ({ doc: (d: string) => ({ set: async (data: any, opts: any) => void ops.push({ path: `${c}/${id}/stats/${d}`, data, opts }) }) }) }) }) } as any;
  const repo = new DailyStatsFirebaseRepository(db);
  await repo.recordLinkClick("events", "e1", "ig_h", "2026-11-09");
  assert.equal(ops[0].path, "events/e1/stats/2026-11-09");
  assert.deepEqual(Object.keys(ops[0].data), ["day", "linkClicks"]);
  assert.deepEqual(Object.keys(ops[0].data.linkClicks), ["ig_h"]);
  assert.deepEqual(ops[0].opts, { merge: true });
  await assert.rejects(repo.recordLinkClick("events", "e1", "evil" as never, "2026-11-09"));
  await assert.rejects(repo.recordLinkClick("users" as never, "e1", "ig", "2026-11-09"));
  assert.equal(ops.length, 1);
});

test("readDays: devuelve los docs diarios con su día, para la serie por día", async () => {
  const db = { collection: () => ({ doc: () => ({ collection: () => ({ where: () => ({ get: async () => ({ docs: [{ id: "2026-11-08", data: () => ({ views: 3 }) }, { id: "2026-11-09", data: () => ({ views: 5 }) }] }) }) }) }) }) } as any;
  const out = await new DailyStatsFirebaseRepository(db).readDays("events", "e1", "2026-11-01");
  assert.deepEqual(out, [{ views: 3, day: "2026-11-08" }, { views: 5, day: "2026-11-09" }]);
});
