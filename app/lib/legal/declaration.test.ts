import { test } from "node:test";
import assert from "node:assert/strict";
import { declarationDocId, declarationVariant, hasDeclared } from "./declaration";

test("la declaración exige exactamente true", () => {
  assert.equal(hasDeclared(true), true);
  for (const v of [false, undefined, null, "true", 1]) assert.equal(hasDeclared(v), false);
});

test("id del documento de evidencia", () => {
  assert.equal(declarationDocId("event", "abc"), "event_abc");
  assert.equal(declarationDocId("site", "xyz"), "site_xyz");
});

test("variante efectiva de la declaración", () => {
  assert.equal(declarationVariant("owner", true), "owner");
  assert.equal(declarationVariant("owner", false), "owner");
  assert.equal(declarationVariant("proposer", true), "qhpa");
  assert.equal(declarationVariant("proposer", false), "proposer");
  assert.equal(declarationVariant(undefined, false), "proposer");
});
