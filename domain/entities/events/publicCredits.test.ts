import assert from "node:assert/strict";
import test from "node:test";

import { publicCredits, publicTeam } from "./publicCredits";

const data = {
  a: { displayName: "A", role: "editor" },
  b: { displayName: "B", role: "viewer" },
  c: { displayName: "C", role: "checkin" },
  d: { displayName: "D", role: "credit" },
};

test("solo editor y credit se acreditan públicamente", () => {
  assert.deepEqual(Object.keys(publicCredits(data)), ["a", "d"]);
  assert.deepEqual(publicCredits(undefined), {});
});

test("publicTeam depura también las referencias", () => {
  const refs = Object.keys(data).map((refId) => ({ refId, kind: "user" as const }));
  const t = publicTeam(refs, data);
  assert.deepEqual(t.collaborators?.map((c) => c.refId), ["a", "d"]);
  assert.equal(publicTeam(undefined, undefined).collaborators, undefined);
});
