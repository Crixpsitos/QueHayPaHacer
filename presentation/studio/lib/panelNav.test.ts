import test from "node:test";
import assert from "node:assert/strict";
import { resolveNav, navToSearch, nextNav } from "./panelNav";

const opts = [
  { key: "event:e1", type: "event" as const, views30: 50 },
  { key: "site:s1", type: "site" as const, views30: 90 },
  { key: "event:e2", type: "event" as const, views30: 5 },
];

test("valores inválidos caen a los predeterminados (30 días, todos) y a la ficha más visitada", () => {
  assert.deepEqual(resolveNav(opts, { f: "zzz", d: "55", t: "raro" }), { f: "site:s1", d: 30, t: "all" });
  assert.deepEqual(resolveNav(opts, {}), { f: "site:s1", d: 30, t: "all" });
});

test("respeta una selección válida", () => {
  assert.deepEqual(resolveNav(opts, { f: "event:e2", d: "90", t: "all" }), { f: "event:e2", d: 90, t: "all" });
});

test("el filtro por tipo manda: una ficha de otro tipo se reemplaza por la más visitada del tipo elegido", () => {
  assert.deepEqual(resolveNav(opts, { f: "site:s1", d: "7", t: "event" }), { f: "event:e1", d: 7, t: "event" });
  assert.deepEqual(resolveNav(opts, { f: "event:e1", t: "site" }), { f: "site:s1", d: 30, t: "site" });
});

test("sin fichas del tipo elegido → ninguna seleccionada", () => {
  assert.deepEqual(resolveNav([opts[0]], { t: "site" }), { f: null, d: 30, t: "site" });
});

test("navToSearch omite lo que es el valor por defecto de t", () => {
  assert.equal(navToSearch({ f: "event:e1", d: 90, t: "all" }), "f=event%3Ae1&d=90");
  assert.equal(navToSearch({ f: null, d: 7, t: "site" }), "d=7&t=site");
});

test("nextNav: cada toque compone sobre el ÚLTIMO estado, nunca sobre uno viejo (clics rápidos)", () => {
  // simula: 90 días y enseguida otra ficha: la ficha nueva NO puede volver a 30
  let nav = resolveNav(opts, { f: "event:e1", d: "30" });
  nav = nextNav(opts, nav, { d: 90 });
  nav = nextNav(opts, nav, { f: "event:e2" });
  assert.deepEqual(nav, { f: "event:e2", d: 90, t: "all" });
  // y al revés: ficha y luego período
  nav = nextNav(opts, nav, { f: "site:s1" });
  nav = nextNav(opts, nav, { d: 7 });
  assert.deepEqual(nav, { f: "site:s1", d: 7, t: "all" });
});

test("nextNav: cambiar el filtro reselecciona dentro del tipo y conserva el período", () => {
  const nav = nextNav(opts, { f: "site:s1", d: 90, t: "all" }, { t: "event" });
  assert.deepEqual(nav, { f: "event:e1", d: 90, t: "event" });
});

test("el filtro «activity» selecciona la actividad más visitada", () => {
  const o = [...opts, { key: "activity:a1", type: "activity" as const, views30: 7 }, { key: "activity:a2", type: "activity" as const, views30: 30 }];
  assert.deepEqual(resolveNav(o, { t: "activity" }), { f: "activity:a2", d: 30, t: "activity" });
  assert.equal(navToSearch({ f: "activity:a2", d: 30, t: "activity" }), "f=activity%3Aa2&d=30&t=activity");
});
