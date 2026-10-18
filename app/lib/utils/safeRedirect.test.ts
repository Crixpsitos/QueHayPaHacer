import { test } from "node:test";
import assert from "node:assert/strict";
import { safeRedirect } from "./safeRedirect";

test("safeRedirect permite rutas relativas y bloquea otros orígenes", () => {
  assert.equal(safeRedirect("/eventos?x=1#a"), "/eventos?x=1#a");
  for (const bad of [undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "/\t/evil.com", "javascript:alert(1)", "evil.com"]) {
    assert.equal(safeRedirect(bad), "/", String(bad));
  }
});
