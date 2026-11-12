import test from "node:test";
import assert from "node:assert/strict";
import { sumStats } from "./fichaStats";
import { buildSeries, buildFunnel, buildVerdict, channelRows, nextStep, dayRange } from "./panel";

test("sumStats extendido: suma vistas por origen, clics de enlaces automáticos y acciones por tipo", () => {
  const t = sumStats([
    { views: 10, bySource: { ch_ig: 6, direct: 4 }, viewsBy: { ch_ig: 6, direct: 4 }, linkClicks: { ig: 7 } },
    { clicks: 3, share: 2, register_external: 1, bySource: { ch_ig: 3 }, linkClicks: { ig: 1, wa: 2 } },
  ] as never);
  assert.deepEqual(t.viewsBy, { ch_ig: 6, direct: 4 });
  assert.deepEqual(t.linkClicks, { ig: 8, wa: 2 });
  assert.deepEqual(t.byType, { share: 2, register_external: 1 });
  assert.equal(t.views, 10);
});

test("dayRange: días consecutivos terminando en 'hoy' (Bogotá)", () => {
  assert.deepEqual(dayRange("2026-11-09", 3), ["2026-11-07", "2026-11-08", "2026-11-09"]);
  assert.deepEqual(dayRange("2026-03-01", 2), ["2026-02-28", "2026-03-01"]);
});

test("buildSeries rellena con 0 los días sin datos y marca el pico", () => {
  const s = buildSeries([{ day: "2026-11-08", views: 5 }, { day: "2026-11-09", views: 9 }, { day: "2026-10-01", views: 99 }], ["2026-11-07", "2026-11-08", "2026-11-09"]);
  assert.deepEqual(s.points, [{ day: "2026-11-07", views: 0 }, { day: "2026-11-08", views: 5 }, { day: "2026-11-09", views: 9 }]);
  assert.deepEqual(s.peak, { day: "2026-11-09", views: 9 });
});

test("buildSeries sin visitas → sin pico", () => {
  assert.equal(buildSeries([], ["2026-11-09"]).peak, null);
});

test("buildFunnel: interés = compartir + mapa + transporte; acción = registro, reserva, WhatsApp, web, redes, llamar; % sobre visitas", () => {
  const f = buildFunnel({ views: 200, clicks: 0, bySource: {}, viewsBy: {}, linkClicks: {}, byType: { share: 10, directions: 20, register_external: 8, whatsapp: 4, booking: 2 } });
  assert.deepEqual(f, { views: 200, interest: 30, action: 14, interestPct: 15, actionPct: 7 });
});

test("buildFunnel sin visitas → ceros y sin dividir por cero", () => {
  assert.deepEqual(buildFunnel({ views: 0, clicks: 0, bySource: {}, viewsBy: {}, linkClicks: {}, byType: { share: 3 } }), { views: 0, interest: 3, action: 0, interestPct: 0, actionPct: 0 });
});

test("buildVerdict: bajo 30 visitas → 'pocos datos', sin juicio", () => {
  const v = buildVerdict({ views: 12, actionPct: 40 });
  assert.equal(v.level, "few");
  assert.match(v.headline, /pocos datos/i);
});

test("buildVerdict: con datos, la frase usa los números reales y el nivel sale de bandas fijas", () => {
  assert.equal(buildVerdict({ views: 100, actionPct: 7 }).level, "good");
  assert.equal(buildVerdict({ views: 100, actionPct: 3 }).level, "ok");
  assert.equal(buildVerdict({ views: 100, actionPct: 1 }).level, "low");
  assert.match(buildVerdict({ views: 128, actionPct: 7 }).headline, /De cada 100 personas que ven esta ficha, 7 hacen clic/);
});

test("channelRows: visitas = viewsBy, acciones = bySource − viewsBy, clics = linkClicks; en el orden de los canales", () => {
  const rows = channelRows({ views: 0, clicks: 0, bySource: { ch_ig: 50, ch_wa: 9 }, viewsBy: { ch_ig: 40, ch_wa: 9 }, linkClicks: { ig: 55, wa: 12 }, byType: {} });
  assert.deepEqual(rows.map((r) => [r.id, r.visits, r.actions, r.linkClicks]), [
    ["ig", 40, 10, 55], ["ig_h", 0, 0, 0], ["wa", 9, 0, 12], ["wc", 0, 0, 0], ["fb", 0, 0, 0], ["qr", 0, 0, 0],
  ]);
});

test("nextStep: historias sin usar con Instagram funcionando → sugiere ese enlace; sin tráfico → copiar enlaces; nada que decir → null", () => {
  const t = (viewsBy: Record<string, number>, linkClicks: Record<string, number>) => ({ views: 100, clicks: 0, bySource: {}, viewsBy, linkClicks, byType: {} });
  assert.equal(nextStep(t({ ch_ig: 40 }, { ig: 50 }))?.channel, "ig_h");
  assert.equal(nextStep(t({}, {}))?.channel, null);
  assert.equal(nextStep(t({ ch_ig: 40, ch_ig_h: 20, ch_wa: 10, ch_wc: 4, ch_fb: 5, ch_qr: 3 }, { ig: 1, ig_h: 1, wa: 1, wc: 1, fb: 1, qr: 1 })), null);
  assert.equal(nextStep({ ...t({}, {}), views: 5 }), null);
});
