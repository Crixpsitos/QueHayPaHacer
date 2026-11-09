import test from "node:test";
import assert from "node:assert/strict";
import { buildTrackWrites } from "./trackWrites";

const inc = (n: number) => ({ inc: n }); // doble de FieldValue.increment

test("view: suma analytics.views y el doc diario con bySource", () => {
  const w = buildTrackWrites("view", "2026-11-09", "instagram", inc);
  assert.deepEqual(w.event, { "analytics.views": { inc: 1 } });
  assert.deepEqual(w.stats, { day: "2026-11-09", views: { inc: 1 }, bySource: { instagram: { inc: 1 } }, viewsBy: { instagram: { inc: 1 } } });
});

test("acción: suma analytics.clicks, el tipo y clicks en el doc diario", () => {
  const w = buildTrackWrites("whatsapp", "2026-11-09", "direct", inc);
  assert.deepEqual(w.event, { "analytics.clicks": { inc: 1 } });
  assert.deepEqual(w.stats, { day: "2026-11-09", whatsapp: { inc: 1 }, clicks: { inc: 1 }, bySource: { direct: { inc: 1 } } });
});

test("link:<código> se guarda bajo la clave cerrada 'link' (sin claves libres)", () => {
  const w = buildTrackWrites("view", "2026-11-09", "link:aB3dE5g", inc);
  assert.deepEqual(w.stats.bySource, { link: { inc: 1 } });
});

test("view por enlace automático: bySource y viewsBy bajo la clave ch_<canal>", () => {
  const w = buildTrackWrites("view", "2026-11-09", "ch:ig_h", inc);
  assert.deepEqual(w.stats.bySource, { ch_ig_h: { inc: 1 } });
  assert.deepEqual(w.stats.viewsBy, { ch_ig_h: { inc: 1 } });
});

test("una acción NO suma viewsBy (así 'visitas' y 'acciones' se separan)", () => {
  const w = buildTrackWrites("share", "2026-11-09", "ch:wa", inc);
  assert.equal("viewsBy" in w.stats, false);
  assert.deepEqual(w.stats.bySource, { ch_wa: { inc: 1 } });
});
