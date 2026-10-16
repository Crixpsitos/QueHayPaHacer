import assert from "node:assert/strict";
import test from "node:test";

import { getListingTrust } from "./listingTrust";

test("niveles de confianza y aviso", () => {
  assert.equal(getListingTrust({}).label, "Comunitario");
  assert.equal(getListingTrust({}).showConfirmNotice, true);
  assert.equal(getListingTrust({ verification: "claimed", kind: "business" }).label, "Reclamado");
  assert.equal(getListingTrust({ verification: "claimed", kind: "business" }).showConfirmNotice, true);
  const v = getListingTrust({ verification: "verified", kind: "business" });
  assert.equal(v.label, "Verificado");
  assert.equal(v.showConfirmNotice, false);
});

test("atractivo público siempre muestra aviso y rótulo extra", () => {
  const t = getListingTrust({ kind: "public", verification: "verified" });
  assert.equal(t.kindLabel, "Atractivo público");
  assert.equal(t.showConfirmNotice, true);
  assert.equal(getListingTrust({ kind: "business" }).kindLabel, null);
});
