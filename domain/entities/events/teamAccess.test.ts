import assert from "node:assert/strict";
import test from "node:test";

import { can, hasStudioAccess, isTeamRole, resolveEventRole } from "./teamAccess";

test("la matriz de permisos", () => {
  // Dueño: todo
  for (const a of ["delete_event", "manage_team", "edit_event"] as const) assert.equal(can("owner", a), true);
  // Editor: edita y publica, pero no borra ni gestiona el equipo
  assert.equal(can("editor", "edit_event"), true);
  assert.equal(can("editor", "publish_event"), true);
  assert.equal(can("editor", "view_attendee_contact"), true);
  assert.equal(can("editor", "delete_event"), false);
  assert.equal(can("editor", "manage_team"), false);
  // Lector: solo mira, sin contacto
  assert.equal(can("viewer", "view_stats"), true);
  assert.equal(can("viewer", "view_registrations"), true);
  assert.equal(can("viewer", "view_attendee_contact"), false);
  assert.equal(can("viewer", "scan_attendance"), false);
  assert.equal(can("viewer", "edit_event"), false);
  // Control de acceso: escanea y confirma, no ve contacto ni estadísticas
  assert.equal(can("checkin", "scan_attendance"), true);
  assert.equal(can("checkin", "confirm_attendance"), true);
  assert.equal(can("checkin", "view_attendee_contact"), false);
  assert.equal(can("checkin", "view_stats"), false);
  assert.equal(can("checkin", "export_registrations"), false);
  // Crédito y sin rol: nada
  assert.equal(hasStudioAccess("credit"), false);
  assert.equal(can(null, "view_stats"), false);
  assert.equal(can(undefined, "scan_attendance"), false);
});

test("resolveEventRole: dueño, miembros con cuenta, externos y desconocidos", () => {
  const event = {
    author: { id: "owner1" },
    collaborators: [
      { refId: "u-editor", kind: "user" },
      { refId: "u-checkin", kind: "user" },
      { refId: "ext1", kind: "external" },
      { refId: "u-bad", kind: "user" },
    ],
    collaboratorsData: {
      "u-editor": { role: "editor" },
      "u-checkin": { role: "checkin" },
      ext1: { role: "editor" }, // un externo nunca gana acceso aunque el dato diga editor
      "u-bad": { role: "root" }, // rol inventado → sin acceso
    },
  };
  assert.equal(resolveEventRole(event, "owner1"), "owner");
  assert.equal(resolveEventRole(event, "u-editor"), "editor");
  assert.equal(resolveEventRole(event, "u-checkin"), "checkin");
  assert.equal(resolveEventRole(event, "ext1"), null);
  assert.equal(resolveEventRole(event, "u-bad"), null);
  assert.equal(resolveEventRole(event, "stranger"), null);
  assert.equal(resolveEventRole(event, null), null);
  assert.equal(resolveEventRole({ author: { id: "o" } }, "x"), null);
});

test("isTeamRole", () => {
  assert.equal(isTeamRole("checkin"), true);
  assert.equal(isTeamRole("owner"), false);
  assert.equal(isTeamRole(undefined), false);
});
