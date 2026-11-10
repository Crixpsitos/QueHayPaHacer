import test from "node:test";
import assert from "node:assert/strict";
import { buildPanel } from "./panelModel";
import { sumStats } from "@/domain/entities/analytics/fichaStats";

const fichas = [
  { type: "event" as const, id: "e1", name: "Candlelight", image: "i.jpg" },
  { type: "site" as const, id: "s1", name: "Nebraska" },
];
const day = (d: string, views: number, extra: Record<string, unknown> = {}) => ({ day: d, views, ...extra });
const base = { fichas, today: "2026-11-09", period: 7 as const, links: [] };

test("chips: ordenadas por visitas de 30 días y con la seleccionada marcada", () => {
  const p = buildPanel({ ...base, selectedKey: "site:s1", stats30: { "event:e1": sumStats([day("2026-11-05", 50)]), "site:s1": sumStats([day("2026-11-05", 70)]) }, docs: [] });
  assert.deepEqual(p.fichas.map((f) => [f.key, f.views30, f.selected]), [["site:s1", 70, true], ["event:e1", 50, false]]);
});

test("sin selección válida usa la más visitada; sin fichas no hay detalle", () => {
  const p = buildPanel({ ...base, selectedKey: "nada", stats30: { "event:e1": sumStats([day("2026-11-05", 90)]), "site:s1": sumStats([]) }, docs: [] });
  assert.equal(p.detail?.id, "e1");
  assert.equal(buildPanel({ ...base, fichas: [], selectedKey: null, stats30: {}, docs: [] }).detail, null);
});

test("detalle: separa período actual y anterior, calcula la variación solo si el anterior tiene datos suficientes", () => {
  // periodo 7 que termina 2026-11-09 → actual 11-03..11-09, anterior 10-27..11-02
  const docs = [day("2026-10-30", 40), day("2026-11-04", 60, { share: 6, register_external: 3 }), day("2026-11-08", 20)];
  const p = buildPanel({ ...base, selectedKey: "event:e1", stats30: { "event:e1": sumStats(docs), "site:s1": sumStats([]) }, docs });
  const d = p.detail!;
  assert.equal(d.kpis.views, 80);
  assert.equal(d.kpis.viewsDeltaPct, 100); // 80 vs 40 → +100 %... pero 40 ≥ 30 vistas
  assert.equal(d.kpis.interest, 6);
  assert.equal(d.kpis.action, 3);
  assert.equal(d.series.points.length, 7);
  assert.deepEqual(d.series.peak, { day: "2026-11-04", views: 60 });
});

test("variación nula cuando el período anterior tiene menos de 30 visitas", () => {
  const docs = [day("2026-10-30", 10), day("2026-11-04", 60)];
  const p = buildPanel({ ...base, selectedKey: "event:e1", stats30: { "event:e1": sumStats(docs), "site:s1": sumStats([]) }, docs });
  assert.equal(p.detail!.kpis.viewsDeltaPct, null);
});

test("veredicto, canales y enlaces propios del detalle", () => {
  const docs = [day("2026-11-04", 100, { viewsBy: { ch_ig: 80, direct: 20 }, bySource: { ch_ig: 90, direct: 20 }, linkClicks: { ig: 95 }, register_external: 9 })];
  const links = [
    { code: "AAAAAAA", label: "Mío", targetType: "event" as const, targetId: "e1", targetName: "", clicks: 4 },
    { code: "BBBBBBB", label: "Otra ficha", targetType: "event" as const, targetId: "otro", targetName: "", clicks: 9 },
  ];
  const d = buildPanel({ ...base, links, selectedKey: "event:e1", stats30: { "event:e1": sumStats(docs), "site:s1": sumStats([]) }, docs }).detail!;
  assert.equal(d.verdict.level, "good");
  assert.equal(d.channels.find((c) => c.id === "ig")?.visits, 80);
  assert.equal(d.sources[0].label, "Instagram");
  assert.equal(d.next?.channel, "ig_h");
  assert.deepEqual(d.customLinks.map((l) => l.code), ["AAAAAAA"]);
  assert.equal(d.publicHref, "/eventos/e1");
});

test("filtro por tipo: la seleccionada es de ese tipo y los conteos siguen siendo del total", () => {
  const stats = { "event:e1": sumStats([day("2026-11-05", 50)]), "site:s1": sumStats([day("2026-11-05", 70)]) };
  const p = buildPanel({ ...base, typeFilter: "event", selectedKey: "site:s1", stats30: stats, docs: [] });
  assert.deepEqual(p.fichas.map((f) => [f.key, f.selected]), [["site:s1", false], ["event:e1", true]]); // todas, la seleccionada es del tipo filtrado
  assert.equal(p.detail?.id, "e1");
  assert.deepEqual(p.counts, { all: 2, event: 1, site: 1 });
  assert.equal(p.typeFilter, "event");
});
