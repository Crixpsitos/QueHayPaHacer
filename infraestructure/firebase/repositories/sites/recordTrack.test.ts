import test from "node:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { SitesFirebaseRepository } from "./SitesFirebaseRepository";
import { SiteTrackBodySchema } from "@/application/dto/sites/SiteTrackDto";
import { sourceKey } from "@/domain/entities/analytics/trafficSource";

function fakeDb() {
  const sets: Array<{ path: string; data: any; opts: unknown }> = [];
  const doc = (path: string): any => ({
    path,
    update: async () => {},
    set: async (data: any, opts: unknown) => void sets.push({ path, data, opts }),
    collection: (c: string) => ({ doc: (d: string) => doc(`${path}/${c}/${d}`) }),
  });
  return { sets, db: { collection: (c: string) => ({ doc: (d: string) => doc(`${c}/${d}`) }) } as any };
}

test("sitio: el doc diario lleva bySource con el origen", async () => {
  const f = fakeDb();
  await new SitesFirebaseRepository(f.db).recordTrack("s1", "view", "2026-11-09", "instagram");
  assert.equal(f.sets[0].path, "sites/s1/stats/2026-11-09");
  assert.deepEqual(Object.keys(f.sets[0].data.bySource), ["instagram"]);
  assert.ok(f.sets[0].data.views);
});

test("sitio: sin origen = direct; link:<código> = clave fija 'link'", async () => {
  const f = fakeDb();
  const repo = new SitesFirebaseRepository(f.db);
  await repo.recordTrack("s1", "website", "d");
  await repo.recordTrack("s1", "view", "d", "link:aB3dE5g");
  assert.deepEqual(Object.keys(f.sets[0].data.bySource), ["direct"]);
  assert.deepEqual(Object.keys(f.sets[1].data.bySource), ["link"]);
});

test("sourceKey y DTO de sitios con src opcional de lista cerrada", () => {
  assert.equal(sourceKey("link:aB3dE5g"), "link");
  assert.equal(sourceKey("tiktok"), "tiktok");
  assert.ok(v.safeParse(SiteTrackBodySchema, { type: "view" }).success);
  assert.ok(v.safeParse(SiteTrackBodySchema, { type: "view", src: "facebook" }).success);
  assert.ok(!v.safeParse(SiteTrackBodySchema, { type: "view", src: "evil" }).success);
});
