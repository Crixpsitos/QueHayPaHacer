import assert from "node:assert/strict";
import { test } from "node:test";
import { randomBytes } from "node:crypto";
import {
  buildCheckInPayload,
  formatCheckInCode,
  generateCheckInCode,
  isValidCheckInCode,
  normalizeCheckInCode,
  parseCheckInPayload,
} from "./checkIn";

test("generateCheckInCode: 12 chars válidos y distintos", () => {
  const a = generateCheckInCode(randomBytes);
  assert.ok(isValidCheckInCode(a));
  assert.notEqual(a, generateCheckInCode(randomBytes));
  assert.equal(generateCheckInCode(() => new Uint8Array(12).fill(255)), "ZZZZZZZZZZZZ");
});

test("format / normalize", () => {
  assert.equal(formatCheckInCode("ABCD1234EFGH"), "ABCD-1234-EFGH");
  assert.equal(normalizeCheckInCode(" abcd-1234 efgh "), "ABCD1234EFGH");
  assert.equal(normalizeCheckInCode("OIl0"), "0110");
});

test("isValidCheckInCode rechaza largo y alfabeto", () => {
  assert.equal(isValidCheckInCode("ABCD1234EFGH"), true);
  assert.equal(isValidCheckInCode("ABCD1234EFG"), false);
  assert.equal(isValidCheckInCode("ABCD1234EFGU"), false);
  assert.equal(isValidCheckInCode("abcd1234efgh"), false);
});

test("payload ida y vuelta", () => {
  const p = buildCheckInPayload({ eventId: "ev1", code: "ABCD1234EFGH" });
  assert.equal(p, "qhpa:1:ev1:-:ABCD1234EFGH");
  assert.deepEqual(parseCheckInPayload(p), { eventId: "ev1", sessionId: null, code: "ABCD1234EFGH" });
  const s = buildCheckInPayload({ eventId: "ev1", sessionId: "s_2", code: "ABCD1234EFGH" });
  assert.deepEqual(parseCheckInPayload(s), { eventId: "ev1", sessionId: "s_2", code: "ABCD1234EFGH" });
});

test("parse acepta código suelto formateado", () => {
  assert.deepEqual(parseCheckInPayload("abcd-1234-efgh"), { code: "ABCD1234EFGH" });
});

test("parse rechaza malformados y otros prefijos", () => {
  for (const bad of [
    "", "hola", "https://x.com/ABCD1234EFGH", "qhpa:2:ev:-:ABCD1234EFGH", "qhpa:1:ev:-:SHORT",
    "qhpa:1:ev:ABCD1234EFGH", "qhpa:1:e/v:-:ABCD1234EFGH", "qhpa:1:ev:-:ABCD1234EFGH:x", "otro:1:ev:-:ABCD1234EFGH",
  ]) assert.equal(parseCheckInPayload(bad), null, bad);
});
