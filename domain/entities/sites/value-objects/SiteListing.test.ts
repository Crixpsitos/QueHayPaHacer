import assert from "node:assert/strict";
import test from "node:test";
import { initialVerification } from "./SiteListing";

test("solo el dueño declarado arranca como 'claimed'; nunca 'verified'", () => {
  assert.equal(initialVerification("owner"), "claimed");
  assert.equal(initialVerification("proposer"), "community");
  assert.equal(initialVerification("qhpa"), "community");
});
