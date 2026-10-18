import { test } from "node:test";
import assert from "node:assert/strict";
import { hasValidBearer } from "./bearerAuth";

const req = (authorization?: string) => new Request("http://x", { headers: authorization ? { authorization } : {} });

test("acepta el secreto correcto con o sin 'Bearer'", () => {
  assert.equal(hasValidBearer(req("Bearer s3cret"), "s3cret"), true);
  assert.equal(hasValidBearer(req("bearer s3cret"), "s3cret"), true);
  assert.equal(hasValidBearer(req("s3cret"), "s3cret"), true);
});

test("rechaza secreto distinto, de otro largo o ausente", () => {
  assert.equal(hasValidBearer(req("Bearer s3creT"), "s3cret"), false);
  assert.equal(hasValidBearer(req("Bearer s3cret-extra"), "s3cret"), false);
  assert.equal(hasValidBearer(req(), "s3cret"), false);
});
