import test from "node:test";
import assert from "node:assert/strict";
import { buildLinksOverview } from "./linksOverview";

const fichas = [
  { type: "event" as const, id: "e1", name: "Candlelight", image: "https://img/e1.jpg" },
  { type: "site" as const, id: "s1", name: "Nebraska" },
  { type: "event" as const, id: "e2", name: "Sin visitas" },
];
const stats = {
  "event:e1": { views: 120, clicks: 14, bySource: { instagram: 90, direct: 44 } },
  "site:s1": { views: 12, clicks: 3, bySource: { whatsapp: 15 } },
  "event:e2": { views: 0, clicks: 0, bySource: {} },
};
const links = [
  { code: "AAAAAAA", label: "IG bio", targetType: "event" as const, targetId: "e1", targetName: "Candlelight", clicks: 30 },
  { code: "BBBBBBB", label: "Historias", targetType: "event" as const, targetId: "e1", targetName: "Candlelight", clicks: 5 },
  { code: "CCCCCCC", label: "Ajeno", targetType: "site" as const, targetId: "otro", targetName: "x", clicks: 9 },
];

test("ordena las fichas por vistas (la más activa primero) y agrupa sus enlaces", () => {
  const o = buildLinksOverview(fichas, stats, links);
  assert.deepEqual(o.fichas.map((f) => f.id), ["e1", "s1", "e2"]);
  assert.deepEqual(o.fichas[0].links.map((l) => l.code), ["AAAAAAA", "BBBBBBB"]);
  assert.equal(o.fichas[1].links.length, 0);
});

test("marca 'pocos datos' bajo 30 vistas y calcula orígenes", () => {
  const o = buildLinksOverview(fichas, stats, links);
  assert.equal(o.fichas[0].fewData, false);
  assert.equal(o.fichas[1].fewData, true);
  assert.equal(o.fichas[0].sources[0].key, "instagram");
  assert.equal(o.fichas[0].image, "https://img/e1.jpg");
});

test("totales: vistas y clics de las fichas mostradas; clics de enlaces solo de enlaces de esas fichas", () => {
  const o = buildLinksOverview(fichas, stats, links);
  assert.deepEqual(o.totals, { views: 132, clicks: 17, linkClicks: 35 });
});

test("ficha sin stats cargadas → ceros", () => {
  const o = buildLinksOverview([fichas[1]], {}, []);
  assert.deepEqual(o.fichas[0], { ...fichas[1], views: 0, clicks: 0, fewData: true, sources: [], links: [] });
});
