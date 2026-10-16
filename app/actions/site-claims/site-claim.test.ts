import { test } from "node:test";
import assert from "node:assert/strict";
import { claimRuleError, MAX_PENDING_CLAIMS_PER_USER } from "@/domain/entities/siteClaim/SiteClaim";
import { parseSiteClaimInput } from "@/application/dto/siteClaim/SiteClaimDto";

const site = { name: "X", published: true, authorId: "admin" };
const base = { site, uid: "u1", hasPendingForSite: false, pendingCount: 0 };

test("reglas del reclamo", () => {
  assert.equal(claimRuleError(base), null);
  assert.ok(claimRuleError({ ...base, site: null }));
  assert.ok(claimRuleError({ ...base, site: { ...site, published: false } }));
  assert.ok(claimRuleError({ ...base, uid: "admin" }));
  assert.ok(claimRuleError({ ...base, hasPendingForSite: true }));
  assert.equal(claimRuleError({ ...base, pendingCount: MAX_PENDING_CLAIMS_PER_USER - 1 }), null);
  assert.ok(claimRuleError({ ...base, pendingCount: MAX_PENDING_CLAIMS_PER_USER }));
});

test("validación de la entrada", () => {
  const ok = { siteId: "abc", relation: "owner", evidence: "Instagram @negocio, escribo desde ahí", declaration: true };
  const res = parseSiteClaimInput({ ...ok, contactPhone: "+57 300 123-4567" });
  assert.ok(res.success && res.output.contactPhone === "+573001234567");
  assert.ok(parseSiteClaimInput(ok).success);
  for (const bad of [
    { ...ok, declaration: false },
    { ...ok, relation: "boss" },
    { ...ok, evidence: "corto" },
    { ...ok, evidence: "x".repeat(801) },
    { ...ok, contactPhone: "abc" },
    { ...ok, siteId: "../x" },
  ])
    assert.equal(parseSiteClaimInput(bad).success, false);
});
