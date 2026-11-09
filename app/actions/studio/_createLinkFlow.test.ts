import test from "node:test";
import assert from "node:assert/strict";
import { createLinkFlow, MAX_LINKS_PER_OWNER } from "./_createLinkFlow";

const ok = { label: "Instagram de Nebraska", targetType: "event", targetId: "ev1" };
function deps(over: Partial<Parameters<typeof createLinkFlow>[0]> = {}) {
  const created: unknown[] = [];
  return {
    created,
    d: {
      uid: "u1" as string | null,
      ownsEvent: async (id: string) => id === "ev1",
      ownsSite: async (id: string) => id === "s1",
      countMine: async () => 0,
      create: async (i: unknown) => (created.push(i), { code: "aB3xY9Z" }),
      ...over,
    },
  };
}

test("sin sesión → error y no crea", async () => {
  const { d, created } = deps({ uid: null });
  assert.deepEqual(await createLinkFlow(d, ok), { success: false, error: "Inicia sesión para crear enlaces." });
  assert.equal(created.length, 0);
});

test("datos inválidos → error de formato y no crea", async () => {
  for (const bad of [{ ...ok, label: "  " }, { ...ok, label: "x".repeat(61) }, { ...ok, targetType: "url" }, { ...ok, targetId: "../x" }, null, "x"]) {
    const { d, created } = deps();
    assert.equal((await createLinkFlow(d, bad)).success, false);
    assert.equal(created.length, 0);
  }
});

test("ficha ajena (evento o sitio) → 'no es tuya' y no crea", async () => {
  const a = deps();
  assert.deepEqual(await createLinkFlow(a.d, { ...ok, targetId: "ajeno" }), { success: false, error: "Solo puedes crear enlaces de tus propios eventos y sitios." });
  const b = deps();
  assert.equal((await createLinkFlow(b.d, { ...ok, targetType: "site", targetId: "ev1" })).success, false);
  assert.equal(a.created.length + b.created.length, 0);
});

test("el dueño sale de la sesión, no del formulario", async () => {
  const { d, created } = deps();
  const res = await createLinkFlow(d, { ...ok, ownerUid: "otro" });
  assert.equal(res.success, true);
  assert.deepEqual(created[0], { label: "Instagram de Nebraska", target: { type: "event", id: "ev1" }, ownerUid: "u1" });
});

test("tope de enlaces por dueño", async () => {
  const { d, created } = deps({ countMine: async () => MAX_LINKS_PER_OWNER });
  const res = await createLinkFlow(d, ok);
  assert.equal(res.success, false);
  assert.equal(created.length, 0);
});

test("éxito de sitio y devuelve el código", async () => {
  const { d } = deps();
  assert.deepEqual(await createLinkFlow(d, { ...ok, targetType: "site", targetId: "s1" }), { success: true, code: "aB3xY9Z" });
});
