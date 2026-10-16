import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyFreshLikes } from "./likedIds";

describe("applyFreshLikes", () => {
  it("agrega los true y quita los false/ausentes de los ids consultados", () => {
    assert.deepEqual(applyFreshLikes({ a: true, b: true }, ["a", "b", "c"], { a: false, c: true }), { c: true });
  });
  it("no toca ids que no se consultaron", () => {
    assert.deepEqual(applyFreshLikes({ x: true }, ["a"], { a: true }), { x: true, a: true });
  });
  it("respuesta vacía (sin sesión en el servidor) limpia los consultados", () => {
    assert.deepEqual(applyFreshLikes({ a: true }, ["a"], {}), {});
  });
});
