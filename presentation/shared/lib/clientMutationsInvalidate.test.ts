import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Los datos propios (perfil, mis eventos, preferencias) se guardan en el navegador (IndexedDB, ver
// app/lib/clientCache). Quien llama a una acción que los cambia debe invalidarlos con invalidateMyData(); si no,
// la próxima pantalla pintaría lo viejo antes de lo fresco.
const MUTATIONS = [
  "profile/update-profile.action",
  "profile/update-profile-visibility.action",
  "profile/update-avatar.action",
  "profile/update-banner.action",
  "profile/delete-banner.action",
  "sites/save-draft-site.action",
  "sites/publish-site.action",
  "sites/update-site.action",
  "sites/delete-site.action",
  "sites/set-site-active.action",
  "events/create-draft-event.action",
  "events/update-event.action",
  "events/publish-event.action",
  "events/migrate-event-type.action",
  "events/delete-event.action",
  "events/create-event-session.action",
  "events/update-event-session.action",
  "events/save-draft-session.action",
  "events/delete-event-session.action",
  "events/set-session-status.action",
  "events/register-event.action",
  "events/cancel-registration.action",
  "studio/respond-collaborator-invitation.action",
  "studio/remove-collaborator.action",
];

// Excepciones: archivos que importan una de esas acciones pero no tocan datos cacheados del usuario actual.
const EXCEPTIONS = new Set<string>([]);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });

test("todo archivo cliente que muta datos propios llama invalidateMyData", () => {
  const root = process.cwd();
  const offenders: string[] = [];
  for (const dir of ["presentation", "app/components"]) {
    for (const file of walk(join(root, dir))) {
      const src = readFileSync(file, "utf8");
      const rel = file.slice(root.length + 1);
      const imports = MUTATIONS.some((m) => src.includes(`@/app/actions/${m}"`));
      if (imports && !EXCEPTIONS.has(rel) && !src.includes("invalidateMyData")) offenders.push(rel);
    }
  }
  assert.deepEqual(offenders, [], "falta `void invalidateMyData()` tras la mutación");
});
