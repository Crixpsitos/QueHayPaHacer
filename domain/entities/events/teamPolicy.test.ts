import assert from "node:assert/strict";
import test from "node:test";
import { isRoleValidForKind, maskRegistrationsForRole, reconcileTeam } from "./teamPolicy";

const rows = [{ userId: "a", formResponses: [{ label: "Email", value: "x@y.co" }] }];

test("máscara: solo owner y editor ven contacto", () => {
  assert.equal(maskRegistrationsForRole(rows, "owner")[0].formResponses?.length, 1);
  assert.equal(maskRegistrationsForRole(rows, "editor")[0].formResponses?.length, 1);
  for (const r of ["viewer", "checkin", "credit", null] as const) {
    const out = maskRegistrationsForRole(rows, r)[0];
    assert.equal("formResponses" in out, false);
    assert.equal(out.userId, "a");
  }
});

const base = {
  ownerId: "o",
  networkUserIds: new Set(["u1", "u2"]),
  networkExternalIds: new Set(["x1"]),
};
const existing = {
  collaborators: [{ refId: "u1", kind: "user" as const }],
  collaboratorsData: { u1: { displayName: "U1", role: "editor" as const } },
};

test("reconcileTeam: no dueño no cambia el equipo", () => {
  const r = reconcileTeam({ ...base, existing, incoming: { collaborators: [], collaboratorsData: {} }, actorRole: "editor" });
  assert.deepEqual(r.collaborators, existing.collaborators);
  assert.deepEqual(r.changedUids, []);
});

test("reconcileTeam: dueño agrega de su red, filtra intrusos y conserva roles", () => {
  const incoming = {
    collaborators: [
      { refId: "u1", kind: "user" as const },
      { refId: "u2", kind: "user" as const },
      { refId: "evil", kind: "user" as const },
      { refId: "x1", kind: "external" as const },
      { refId: "o", kind: "user" as const },
    ],
    collaboratorsData: {
      u1: { displayName: "U1", role: "viewer" as const }, // intento de cambiar rol: se ignora
      u2: { displayName: "U2", role: "checkin" as const },
      evil: { displayName: "E", role: "editor" as const },
      x1: { displayName: "X", role: "editor" as const }, // externo con rol de cuenta: rechazado
      o: { displayName: "O", role: "editor" as const },
    },
  };
  const r = reconcileTeam({ ...base, existing, incoming, actorRole: "owner" });
  assert.deepEqual(r.collaborators.map((c) => c.refId), ["u1", "u2"]);
  assert.equal(r.collaboratorsData.u1.role, "editor");
  assert.equal(r.collaboratorsData.u2.role, "checkin");
  assert.deepEqual(r.changedUids, ["u2"]);
});

test("reconcileTeam: quitar a alguien lo marca como cambiado", () => {
  const r = reconcileTeam({ ...base, existing, incoming: { collaborators: [], collaboratorsData: {} }, actorRole: "owner" });
  assert.deepEqual(r.changedUids, ["u1"]);
});

test("rol válido por tipo", () => {
  assert.equal(isRoleValidForKind("external", "credit"), true);
  assert.equal(isRoleValidForKind("external", "editor"), false);
  assert.equal(isRoleValidForKind("user", "checkin"), true);
  assert.equal(isRoleValidForKind("user", "owner"), false);
});
