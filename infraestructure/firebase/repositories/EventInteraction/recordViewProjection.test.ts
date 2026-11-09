import test from "node:test";
import assert from "node:assert/strict";
import { UserEventInteractionsProjectionFirebaseRepository } from "./UserEventInteractionsProjectionFirebaseRepository";

function fakeDb(existing: Record<string, unknown> | null) {
  const writes: Array<{ path: string; data: any; opts: unknown }> = [];
  const doc = (path: string): any => ({
    get: async () => ({ exists: existing !== null, data: () => existing }),
    set: async (data: any, opts: unknown) => void writes.push({ path, data, opts }),
    collection: (c: string) => ({ doc: (d: string) => doc(`${path}/${c}/${d}`) }),
  });
  return { writes, db: { collection: (c: string) => ({ doc: (d: string) => doc(`${c}/${d}`) }) } as any };
}

test("primera vista: escribe viewedAt en users/{uid}/eventInteractions/{id}", async () => {
  const f = fakeDb(null);
  await new UserEventInteractionsProjectionFirebaseRepository(f.db).recordViewProjection("ev1", "u1");
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].path, "users/u1/eventInteractions/ev1");
  assert.ok(f.writes[0].data.viewedAt);
  assert.deepEqual(f.writes[0].opts, { merge: true });
});

test("ya tiene viewedAt: no escribe (no dispara el trigger de preferencias otra vez)", async () => {
  const f = fakeDb({ viewedAt: new Date() });
  await new UserEventInteractionsProjectionFirebaseRepository(f.db).recordViewProjection("ev1", "u1");
  assert.equal(f.writes.length, 0);
});

test("existe (por un like) pero sin viewedAt: sí registra la vista, sin pisar createdAt", async () => {
  const f = fakeDb({ liked: true });
  await new UserEventInteractionsProjectionFirebaseRepository(f.db).recordViewProjection("ev1", "u1");
  assert.equal(f.writes.length, 1);
  assert.equal("createdAt" in f.writes[0].data, false);
});
