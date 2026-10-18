import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ctaHref } from "./ctaHref";

describe("ctaHref", () => {
  it("navigate: recurso/ruta con query", () => {
    assert.equal(
      ctaHref({ id: "a", label: "x", type: "navigate", entity: { resource: "eventos", path: "fin-de-semana", params: { q: "a b" } } }),
      "/eventos/fin-de-semana?q=a+b",
    );
  });
  it("navigate sin params: sin signo ?", () => {
    assert.equal(
      ctaHref({ id: "a", label: "x", type: "navigate", entity: { resource: "donde-ir", path: "todos" } }),
      "/donde-ir/todos",
    );
  });
  it("external_link: la URL tal cual", () => {
    assert.equal(
      ctaHref({ id: "a", label: "x", type: "external_link", entity: { resource: "", path: "https://example.com/a", target: "_blank" } }),
      "https://example.com/a",
    );
  });
  it("formato antiguo { label, href } de Firestore", () => {
    assert.equal(ctaHref({ label: "x", href: "/eventos" }), "/eventos");
  });
  it("sin destino: undefined", () => {
    assert.equal(ctaHref({ id: "a", label: "x" } as never), undefined);
  });
});
