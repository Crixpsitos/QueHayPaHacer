import { test } from "node:test";
import assert from "node:assert/strict";
import { readableTextColor, safeHexColor } from "./externalLink";

test("safeHexColor acepta #RRGGBB y recorta espacios", () => {
  assert.equal(safeHexColor(" #1A2B3C "), "#1A2B3C");
});

test("safeHexColor rechaza todo lo que no sea #RRGGBB", () => {
  for (const bad of ["", undefined, "red", "#fff", "#12345G", "url(javascript:1)", "#123456; background:red"]) {
    assert.equal(safeHexColor(bad), undefined);
  }
});

test("readableTextColor usa texto blanco sobre fondos oscuros y oscuro sobre claros", () => {
  assert.equal(readableTextColor("#000000"), "#FFFFFF");
  assert.equal(readableTextColor("#D42F3C"), "#FFFFFF");
  assert.equal(readableTextColor("#FFFFFF"), "#09090B");
  assert.equal(readableTextColor("#FFD60A"), "#09090B");
});
