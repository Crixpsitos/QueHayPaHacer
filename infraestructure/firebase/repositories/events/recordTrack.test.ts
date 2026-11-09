import test from "node:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { EventsFirebaseRepository } from "./EventsFirebaseRepository";
import { EventTrackBodySchema } from "@/application/dto/events/EventTrackDto";

function fakeDb(commit: () => Promise<void> = async () => {}) {
  const ops: Array<{ op: string; path: string }> = [];
  const doc = (path: string): any => ({ path, collection: (c: string) => ({ doc: (d: string) => doc(`${path}/${c}/${d}`) }) });
  return {
    ops,
    db: {
      collection: (c: string) => ({ doc: (d: string) => doc(`${c}/${d}`) }),
      batch: () => ({
        update: (ref: any) => void ops.push({ op: "update", path: ref.path }),
        set: (ref: any) => void ops.push({ op: "set", path: ref.path }),
        commit,
      }),
    } as any,
  };
}

test("recordTrack: update del evento + set del doc diario, en un solo batch", async () => {
  const f = fakeDb();
  await new EventsFirebaseRepository(f.db).recordTrack("ev1", "view", "2026-11-09", "direct");
  assert.deepEqual(f.ops, [
    { op: "update", path: "events/ev1" },
    { op: "set", path: "events/ev1/stats/2026-11-09" },
  ]);
});

test("recordTrack: evento inexistente (NOT_FOUND) se ignora sin lanzar", async () => {
  const f = fakeDb(async () => { throw Object.assign(new Error("nf"), { code: 5 }); });
  await new EventsFirebaseRepository(f.db).recordTrack("nope", "view", "2026-11-09", "direct");
});

test("recordTrack: otros errores sí se propagan", async () => {
  const f = fakeDb(async () => { throw Object.assign(new Error("boom"), { code: 14 }); });
  await assert.rejects(new EventsFirebaseRepository(f.db).recordTrack("e", "view", "d", "direct"));
});

test("DTO: type inválido y src libre se rechazan", () => {
  assert.ok(v.safeParse(EventTrackBodySchema, { type: "view" }).success);
  assert.ok(v.safeParse(EventTrackBodySchema, { type: "view", src: "link:aB3dE5g" }).success);
  assert.ok(!v.safeParse(EventTrackBodySchema, { type: "like" }).success);
  assert.ok(!v.safeParse(EventTrackBodySchema, { type: "view", src: "evil.com" }).success);
  assert.ok(!v.safeParse(EventTrackBodySchema, { type: "view", src: "link:../../x" }).success);
});

test("el cuerpo del beacon acepta el canal de un enlace automático y rechaza canales inventados", () => {
  assert.equal(v.safeParse(EventTrackBodySchema, { type: "view", src: "ch:ig_h" }).success, true);
  assert.equal(v.safeParse(EventTrackBodySchema, { type: "view", src: "ch:evil" }).success, false);
});
