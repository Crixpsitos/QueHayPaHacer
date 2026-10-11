import { test } from "node:test";
import assert from "node:assert/strict";
import { declarationDocId, hasDeclared } from "./declaration";

test("la declaración exige exactamente true", () => {
  assert.equal(hasDeclared(true), true);
  for (const v of [false, undefined, null, "true", 1]) assert.equal(hasDeclared(v), false);
});

test("id del documento de evidencia", () => {
  assert.equal(declarationDocId("event", "abc"), "event_abc");
  assert.equal(declarationDocId("site", "xyz"), "site_xyz");
});
