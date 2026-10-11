import assert from "node:assert/strict";
import test from "node:test";

import { renderDescriptionHTML } from "./renderDescription";

const p = (...content: unknown[]) => ({ type: "doc", content: [{ type: "paragraph", content }] });
const link = (href: string) => ({ type: "text", text: "clic", marks: [{ type: "link", attrs: { href } }] });

test("escapa el texto", () => {
  const html = renderDescriptionHTML(p({ type: "text", text: "<script>alert(1)</script><img src=x onerror=alert(1)>" }));
  assert.doesNotMatch(html, /<script|<img/i);
  assert.match(html, /&lt;script&gt;/);
});

test("quita links javascript:/data: y deja los http", () => {
  for (const href of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>"]) {
    assert.doesNotMatch(renderDescriptionHTML(p(link(href))), /href|javascript|data:/i, href);
  }
  assert.match(renderDescriptionHTML(p(link("https://ibague.gov.co"))), /href="https:\/\/ibague\.gov\.co"/);
});

test("ignora atributos y nodos fuera del esquema", () => {
  const html = renderDescriptionHTML({
    type: "doc",
    content: [
      { type: "paragraph", attrs: { onclick: "alert(1)", style: "x" }, content: [{ type: "text", text: "hola" }] },
      { type: "rawHtml", attrs: { html: "<script>alert(1)</script>" } },
    ],
  });
  assert.doesNotMatch(html, /onclick|<script/i);
  assert.match(html, /hola/);
});

test("entradas vacías o inválidas", () => {
  assert.equal(renderDescriptionHTML(null), "");
  assert.equal(renderDescriptionHTML("texto"), "");
});

test("no permite romper el atributo href con comillas", () => {
  const html = renderDescriptionHTML(p(link('https://x.co/" onmouseover="alert(1)')));
  assert.doesNotMatch(html, /" onmouseover=/);
});
