import test from "node:test";
import assert from "node:assert/strict";
import { sumStats, sourceShares, FEW_DATA_BELOW } from "./fichaStats";

test("sumStats suma días: vistas, clics y orígenes; ignora campos inválidos", () => {
  const out = sumStats([
    { views: 10, clicks: 2, bySource: { instagram: 7, direct: 5 } },
    { views: 3, bySource: { instagram: 1, whatsapp: 1 } },
    { views: "x" as never, clicks: -4, bySource: { evil: Number.NaN } as never },
    {},
  ]);
  assert.deepEqual(out, { views: 13, clicks: 2, bySource: { instagram: 8, direct: 5, whatsapp: 1 }, viewsBy: {}, linkClicks: {}, byType: {} });
});

test("sumStats sin días → ceros", () => {
  assert.deepEqual(sumStats([]), { views: 0, clicks: 0, bySource: {}, viewsBy: {}, linkClicks: {}, byType: {} });
});

test("sourceShares: ordena, calcula % sobre el total, nombres en español y agrupa la cola en 'Otros'", () => {
  const s = sourceShares({ instagram: 50, whatsapp: 25, direct: 10, facebook: 8, tiktok: 4, google: 3 }, 3);
  assert.deepEqual(s.map((x) => [x.key, x.label, x.count, x.pct]), [
    ["instagram", "Instagram", 50, 50],
    ["whatsapp", "WhatsApp", 25, 25],
    ["direct", "Directo", 10, 10],
    ["other", "Otros", 15, 15],
  ]);
});

test("sourceShares: vacío → []; 'link' se llama 'Tus enlaces'; porcentajes enteros que no pasan de 100", () => {
  assert.deepEqual(sourceShares({}), []);
  assert.equal(sourceShares({ link: 1, direct: 2 })[1].label, "Tus enlaces");
  const total = sourceShares({ a: 1, instagram: 1, direct: 1 } as never).reduce((n, x) => n + x.pct, 0);
  assert.ok(total <= 100);
});

test("umbral de pocos datos", () => assert.equal(FEW_DATA_BELOW, 30));
