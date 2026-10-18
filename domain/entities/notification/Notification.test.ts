import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeNotification, NOTIFICATION_TITLE_MAX } from "./Notification";
import { claimResolvedNotification, suggestionResolvedNotification } from "./messages";

const base = { type: "site_moderation", title: "x" } as const;

test("recorta títulos largos y quita espacios", () => {
  const n = sanitizeNotification({ ...base, title: `  ${"a".repeat(500)}  ` });
  assert.equal(n.title.length, NOTIFICATION_TITLE_MAX);
  assert.ok(n.title.endsWith("…"));
});

test("solo deja rutas internas", () => {
  assert.equal(sanitizeNotification({ ...base, href: "/sites" }).href, "/sites");
  assert.equal(sanitizeNotification({ ...base, href: "https://malo.com" }).href, undefined);
  assert.equal(sanitizeNotification({ ...base, href: "//malo.com" }).href, undefined);
});

test("omite el cuerpo vacío", () => {
  assert.equal("body" in sanitizeNotification({ ...base, body: "  " }), false);
});

test("sugerencia aceptada y rechazada con nota", () => {
  const ok = suggestionResolvedNotification({ siteName: "Café", field: "hours", accepted: true });
  assert.match(ok.title, /Aceptaron/);
  assert.equal(ok.body, "Horario");
  const no = suggestionResolvedNotification({ siteName: "Café", field: "hours", accepted: false, note: "Ya está al día" });
  assert.match(no.title, /No aceptaron/);
  assert.equal(no.body, "Horario · Ya está al día");
});

test("reclamo rechazado lleva el motivo", () => {
  assert.equal(claimResolvedNotification({ siteName: "Finca", approved: false, reason: "Sin evidencia" }).body, "Sin evidencia");
  assert.equal(claimResolvedNotification({ siteName: "Finca", approved: true }).href, "/sites");
});
