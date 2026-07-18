import { test } from "node:test";
import assert from "node:assert/strict";
import type { Firestore } from "firebase-admin/firestore";
import { StudioFirebaseRepository } from "./StudioFirebaseRepository";

type Doc = Record<string, unknown>;

/**
 * Fake Firestore mínimo: collection().doc() con get/delete y runTransaction con
 * get/update. Suficiente para probar el branching de respond/cancel sin emulador.
 */
function makeFakeDb(seed: Record<string, Doc>) {
  const store = new Map<string, Doc>(Object.entries(seed));
  const updates: { key: string; data: Doc }[] = [];
  const deletes: string[] = [];

  const snap = (key: string) => ({
    id: key.split("/").pop()!,
    exists: store.has(key),
    data: () => store.get(key),
  });

  const ref = (key: string) => ({
    _key: key,
    id: key.split("/").pop()!,
    get: async () => snap(key),
    delete: async () => {
      deletes.push(key);
      store.delete(key);
    },
  });

  const db = {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
    runTransaction: async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: async (r: { _key: string }) => snap(r._key),
        update: (r: { _key: string }, data: Doc) => {
          updates.push({ key: r._key, data });
          store.set(r._key, { ...(store.get(r._key) ?? {}), ...data });
        },
      };
      return fn(tx);
    },
  };

  return { db: db as unknown as Firestore, store, updates, deletes };
}

test("respondCollaboratorInvitation: rechaza si el uid no es el invitado (toUid)", async () => {
  const { db } = makeFakeDb({
    "collaborationInvites/inv1": { fromUid: "owner", toUid: "userA", status: "pending" },
  });
  const repo = new StudioFirebaseRepository(db);
  await assert.rejects(
    () => repo.respondCollaboratorInvitation("inv1", "intruso", true),
    /No autorizado/,
  );
});

test("respondCollaboratorInvitation: aceptar marca la invitación como accepted", async () => {
  const { db, updates } = makeFakeDb({
    "collaborationInvites/inv1": { fromUid: "owner", toUid: "userA", status: "pending" },
  });
  const repo = new StudioFirebaseRepository(db);
  await repo.respondCollaboratorInvitation("inv1", "userA", true);

  const upd = updates.find((u) => u.key === "collaborationInvites/inv1");
  assert.ok(upd, "debe actualizar la invitación");
  assert.equal((upd!.data as Doc).status, "accepted");
});

test("respondCollaboratorInvitation: idempotente si ya no está pendiente", async () => {
  const { db, updates } = makeFakeDb({
    "collaborationInvites/inv1": { fromUid: "owner", toUid: "userA", status: "accepted" },
  });
  const repo = new StudioFirebaseRepository(db);
  await repo.respondCollaboratorInvitation("inv1", "userA", true);
  assert.equal(updates.length, 0);
});

test("cancelInvitation: rechaza si el uid no es quien envió (fromUid)", async () => {
  const { db } = makeFakeDb({
    "collaborationInvites/inv1": { fromUid: "owner", toUid: "userA", status: "pending" },
  });
  const repo = new StudioFirebaseRepository(db);
  await assert.rejects(() => repo.cancelInvitation("inv1", "intruso"), /No autorizado/);
});

test("cancelInvitation: el emisor borra su invitación pendiente", async () => {
  const { db, deletes } = makeFakeDb({
    "collaborationInvites/inv1": { fromUid: "owner", toUid: "userA", status: "pending" },
  });
  const repo = new StudioFirebaseRepository(db);
  await repo.cancelInvitation("inv1", "owner");
  assert.deepEqual(deletes, ["collaborationInvites/inv1"]);
});
