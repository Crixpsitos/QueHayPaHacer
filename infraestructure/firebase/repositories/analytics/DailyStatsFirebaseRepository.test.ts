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
  assert.deepEqual(out, { views: 7, clicks: 1, bySource: { instagram: 6, direct: 2 } });
});

test("sumSince: solo events o sites y ids seguros (nada de rutas arbitrarias)", async () => {
  const f = fakeDb({});
  const repo = new DailyStatsFirebaseRepository(f.db);
  await assert.rejects(repo.sumSince("users" as never, "e1", "2026-10-10"));
  await assert.rejects(repo.sumSince("events", "../x", "2026-10-10"));
  assert.equal(f.reads.length, 0);
});
