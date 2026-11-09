import test from "node:test";
import assert from "node:assert/strict";
import { shareMessage, wrapLines, eventWhen } from "./shareKit";

test("shareMessage arma un texto listo para pegar con título, cuándo, dónde y el enlace", () => {
  assert.equal(
    shareMessage({ title: "Candlelight: tributo a Coldplay", when: "sáb 22 nov, 8:00 p. m.", where: "Teatro Tolima", url: "https://yquehaypahacer.com/r/e/e1/wa" }),
    "Candlelight: tributo a Coldplay. sáb 22 nov, 8:00 p. m. Teatro Tolima. Más información aquí: https://yquehaypahacer.com/r/e/e1/wa",
  );
});

test("shareMessage omite lo que falta, sin puntos dobles", () => {
  assert.equal(shareMessage({ title: "Nebraska Helados.", url: "https://x.co/r/s/s1/wa" }), "Nebraska Helados. Más información aquí: https://x.co/r/s/s1/wa");
});

test("wrapLines parte por palabras sin pasar el ancho y corta con … al llegar al máximo de líneas", () => {
  assert.deepEqual(wrapLines("uno dos tres cuatro", 9, 5), ["uno dos", "tres", "cuatro"]);
  assert.deepEqual(wrapLines("aaaa bbbb cccc dddd", 5, 2), ["aaaa", "bbbb…"]);
  assert.deepEqual(wrapLines("", 10, 3), []);
  assert.deepEqual(wrapLines("palabralarguísimaquenocabe corta", 8, 3).every((l) => l.length <= 9), true);
});

test("eventWhen formatea fecha y hora en español de Colombia (zona Bogotá), o '' si la fecha no es válida", () => {
  assert.equal(eventWhen("2026-11-22T20:00:00-05:00"), "domingo 22 de noviembre, 8:00 p. m.");
  assert.equal(eventWhen("no es fecha"), "");
});
