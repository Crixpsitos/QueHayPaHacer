import { test } from "node:test";
import assert from "node:assert/strict";
import { SPAM_LIMITS as L, normalizeText, spamGuardError } from "./spamGuard";

const now = 1_000_000_000_000;
const ago = (ms: number, text?: string) => ({ at: now - ms, text });
const sug = (recent: ReturnType<typeof ago>[], extra = {}) => spamGuardError({ kind: "suggestion", recent, now, ...extra });
const claim = (recent: ReturnType<typeof ago>[]) => spamGuardError({ kind: "claim", recent, now });

test("normaliza texto", () => assert.equal(normalizeText("  Abren   A las\n8 "), "abren a las 8"));

test("sin historial pasa", () => {
  assert.equal(sug([]), null);
  assert.equal(claim([]), null);
});

test("enfriamiento de 30 s", () => {
  assert.match(sug([ago(L.cooldownMs - 1)])!, /Espera unos segundos/);
  assert.equal(sug([ago(L.cooldownMs)]), null);
  assert.match(claim([ago(1000)])!, /Espera unos segundos/);
});

test("tope por hora y por día de sugerencias", () => {
  const hour = Array.from({ length: L.suggestionsPerHour }, (_, i) => ago(L.cooldownMs + 60_000 * (i + 1)));
  assert.match(sug(hour)!, /por hora/);
  assert.equal(sug(hour.slice(1)), null);
  // fuera de la hora pero dentro del día: cuenta para el día
  const day = Array.from({ length: L.suggestionsPerDay }, (_, i) => ago(2 * 3_600_000 + 60_000 * i));
  assert.match(sug(day)!, /por día/);
  assert.equal(sug(day.slice(1)), null);
  assert.equal(sug([ago(25 * 3_600_000), ...day.slice(1)]), null);
});

test("tope diario de reclamos", () => {
  const r = Array.from({ length: L.claimsPerDay }, (_, i) => ago(3_600_000 * (i + 1)));
  assert.match(claim(r)!, /por día/);
  assert.equal(claim(r.slice(1)), null);
  assert.equal(claim([ago(25 * 3_600_000), ...r.slice(1)]), null);
});

test("texto duplicado en 7 días, cualquier sitio", () => {
  const prev = ago(3_600_000, normalizeText("Abren a las 8 am"));
  assert.match(sug([prev], { text: "  ABREN a   las 8 AM " })!, /misma sugerencia/);
  assert.equal(sug([prev], { text: "Abren a las 9 am" }), null);
  assert.equal(sug([ago(L.duplicateWindowMs + 1, prev.text)], { text: "abren a las 8 am" }), null);
});

test("cuenta muy nueva; sin dato no se comprueba", () => {
  assert.match(sug([], { accountCreatedAt: now - L.minAccountAgeMs + 1 })!, /muy reciente/);
  assert.equal(sug([], { accountCreatedAt: now - L.minAccountAgeMs }), null);
  assert.equal(sug([], {}), null);
});
