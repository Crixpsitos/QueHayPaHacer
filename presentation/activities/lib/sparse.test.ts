import { test } from "node:test"
import assert from "node:assert/strict"
import { isSparse } from "./sparse"

const rich = { gallery: [1, 2], description: "x".repeat(400), sections: [1] }

test("ficha completa: no es escasa", () => assert.equal(isSparse(rich), false))
test("sin fotos: escasa", () => assert.equal(isSparse({ ...rich, gallery: [] }), true))
test("descripción corta y sin secciones: escasa", () => assert.equal(isSparse({ ...rich, description: "Trote suave.", sections: [] }), true))
test("descripción corta pero con secciones desplegables: no es escasa", () => assert.equal(isSparse({ ...rich, description: "Trote suave." }), false))
test("descripción larga sin secciones: no es escasa", () => assert.equal(isSparse({ ...rich, sections: [] }), false))
