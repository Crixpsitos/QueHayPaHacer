import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestionRuleError, MAX_PENDING_SUGGESTIONS_PER_USER } from "@/domain/entities/siteSuggestion/SiteSuggestion";
import { parseSiteSuggestionInput } from "@/application/dto/siteSuggestion/SiteSuggestionDto";

const site = { name: "X", published: true, authorId: "admin" };
const base = { site, uid: "u1", pending: [], siteId: "s1", field: "hours" as const };

test("reglas de la sugerencia", () => {
  assert.equal(suggestionRuleError(base), null);
  assert.ok(suggestionRuleError({ ...base, uid: null }));
  assert.ok(suggestionRuleError({ ...base, site: null }));
  assert.ok(suggestionRuleError({ ...base, site: { ...site, published: false } }));
  assert.ok(suggestionRuleError({ ...base, uid: "admin" }));
  assert.ok(suggestionRuleError({ ...base, pending: [{ siteId: "s1", field: "hours" }] }));
  // mismo sitio, otro campo: permitido
  assert.equal(suggestionRuleError({ ...base, pending: [{ siteId: "s1", field: "prices" }] }), null);
  const many = Array.from({ length: MAX_PENDING_SUGGESTIONS_PER_USER }, (_, i) => ({ siteId: `o${i}`, field: "hours" }));
  assert.ok(suggestionRuleError({ ...base, pending: many }));
  assert.equal(suggestionRuleError({ ...base, pending: many.slice(1) }), null);
});

test("validación de la entrada", () => {
  const ok = { siteId: "abc", field: "hours", description: "Ahora abren a las 8 am", declaration: true };
  const res = parseSiteSuggestionInput({ ...ok, description: "  Ahora abren a las 8 am  ", source: "  estuve ahí  " });
  assert.ok(res.success && res.output.description === "Ahora abren a las 8 am" && res.output.source === "estuve ahí");
  assert.ok(parseSiteSuggestionInput(ok).success);
  for (const bad of [
    { ...ok, declaration: false },
    { ...ok, field: "name" },
    { ...ok, description: "corto" },
    { ...ok, description: "          x          " },
    { ...ok, description: "x".repeat(601) },
    { ...ok, source: "x".repeat(301) },
    { ...ok, siteId: "../x" },
  ])
    assert.equal(parseSiteSuggestionInput(bad).success, false);
});
