import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLikeSync, type LikeState } from "./createLikeSync";

const setup = (commit: (liked: boolean) => Promise<boolean>, initial: LikeState = { liked: false, count: 5 }) => {
  const seen: LikeState[] = [];
  const sync = createLikeSync({ initial, commit, onChange: (s) => seen.push(s) });
  return { sync, seen };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("createLikeSync", () => {
  it("cambia al instante, antes de que responda el servidor", async () => {
    let release!: (ok: boolean) => void;
    const { sync } = setup(() => new Promise((r) => (release = r)));
    sync.toggle();
    assert.deepEqual(sync.state(), { liked: true, count: 6 });
    release(true);
    await tick();
    assert.deepEqual(sync.state(), { liked: true, count: 6 });
  });

  it("si el servidor rechaza, vuelve al estado confirmado", async () => {
    const { sync } = setup(async () => false);
    sync.toggle();
    await tick();
    assert.deepEqual(sync.state(), { liked: false, count: 5 });
  });

  it("toques rápidos: un solo envío en vuelo y solo se manda el estado final", async () => {
    const sent: boolean[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    const { sync } = setup((liked) => {
      sent.push(liked);
      return new Promise((r) => releases.push(r));
    });
    sync.toggle(); // like
    sync.toggle(); // unlike
    sync.toggle(); // like
    assert.deepEqual(sent, [true]);
    releases[0](true);
    await tick();
    // El estado final deseado (like) ya estaba confirmado: no hay segundo envío.
    assert.deepEqual(sent, [true]);
    assert.deepEqual(sync.state(), { liked: true, count: 6 });
  });

  it("toque que revierte mientras hay un envío: se manda el estado final", async () => {
    const sent: boolean[] = [];
    const releases: Array<(ok: boolean) => void> = [];
    const { sync } = setup((liked) => {
      sent.push(liked);
      return new Promise((r) => releases.push(r));
    });
    sync.toggle(); // like (en vuelo)
    sync.toggle(); // unlike mientras tanto
    releases[0](true);
    await tick();
    assert.deepEqual(sent, [true, false]);
    releases[1](true);
    await tick();
    assert.deepEqual(sync.state(), { liked: false, count: 5 });
  });

  it("reset aplica datos del servidor hasta que la persona toca el corazón", async () => {
    const { sync } = setup(async () => true);
    sync.reset({ liked: true, count: 9 });
    assert.deepEqual(sync.state(), { liked: true, count: 9 });
    sync.toggle();
    await tick();
    // Lectura atrasada (dice que no hay like): no pisa lo que la persona acaba de hacer.
    sync.reset({ liked: true, count: 9 });
    assert.deepEqual(sync.state(), { liked: false, count: 8 });
  });

  it("el contador nunca baja de 0", async () => {
    const { sync } = setup(async () => true, { liked: true, count: 0 });
    sync.toggle();
    assert.equal(sync.state().count, 0);
    await tick();
    assert.equal(sync.state().count, 0);
  });
});
