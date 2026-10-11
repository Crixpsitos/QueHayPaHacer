import { test } from "node:test";
import assert from "node:assert/strict";
import { hasValidAcceptance } from "./acceptance";

test("exige ambos booleanos exactamente true", () => {
  assert.equal(hasValidAcceptance(true, true), true);
  assert.equal(hasValidAcceptance(true, false), false);
  assert.equal(hasValidAcceptance(undefined, true), false);
  assert.equal(hasValidAcceptance("true", true), false);
});
