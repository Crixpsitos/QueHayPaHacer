import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReportInput } from "./ReportDto";

const base = { targetType: "event", targetId: "abc123", reason: "spam" };

test("acepta un motivo válido del tipo", () => {
  const r = parseReportInput(base);
  assert.equal(r.success, true);
  assert.equal(r.success && r.output.details, "");
});

test("rechaza un motivo que no pertenece al tipo", () => {
  assert.equal(parseReportInput({ ...base, reason: "closed" }).success, false);
  assert.equal(parseReportInput({ ...base, targetType: "site", reason: "scam" }).success, false);
  assert.equal(parseReportInput({ ...base, targetType: "site", reason: "closed" }).success, true);
});

test("'other' exige detalles de al menos 10 caracteres", () => {
  assert.equal(parseReportInput({ ...base, reason: "other" }).success, false);
  assert.equal(parseReportInput({ ...base, reason: "other", details: "  corto   " }).success, false);
  assert.equal(parseReportInput({ ...base, reason: "other", details: "Esto es engañoso" }).success, true);
});

test("rechaza detalles de más de 500 caracteres", () => {
  assert.equal(parseReportInput({ ...base, details: "a".repeat(501) }).success, false);
  assert.equal(parseReportInput({ ...base, details: "a".repeat(500) }).success, true);
});

test("rechaza ids con caracteres de ruta y descarta sessionId en sitios", () => {
  assert.equal(parseReportInput({ ...base, targetId: "a/b" }).success, false);
  const r = parseReportInput({ ...base, targetType: "site", reason: "closed", sessionId: "s1" });
  assert.equal(r.success && r.output.sessionId, undefined);
});
