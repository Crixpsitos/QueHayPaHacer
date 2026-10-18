import { test } from "node:test";
import assert from "node:assert/strict";
import { generateUniqueUsernameCandidate, generateUsername } from "./generateUsername";

test("generateUsername normaliza nombre y apellidos", () => {
  assert.equal(generateUsername("Cristian Peña"), "cristianpena");
});

test("generateUsername elimina símbolos y respeta la longitud máxima", () => {
  assert.equal(generateUsername("  María-José!  ", 8), "mariajos");
});

test("generateUniqueUsernameCandidate crea candidatos válidos y distintos", () => {
  const first = generateUniqueUsernameCandidate("cristianpena");
  const second = generateUniqueUsernameCandidate("cristianpena");

  assert.match(first, /^cristianpena[a-z0-9]{6}$/);
  assert.match(second, /^cristianpena[a-z0-9]{6}$/);
  assert.notEqual(first, second);
});

test("generateUniqueUsernameCandidate limita el resultado a 30 caracteres", () => {
  const username = generateUniqueUsernameCandidate("cristianandrespenamontealegre");

  assert.equal(username.length, 30);
  assert.match(username, /^[a-z0-9]+$/);
});
