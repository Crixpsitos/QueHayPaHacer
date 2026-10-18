import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fichas y landings públicas se cachean en el CDN (ver headers() en next.config.ts): su HTML no puede depender de
// quién mira. Si alguien vuelve a leer la sesión en estos componentes de servidor, la caché serviría el estado
// de una persona a otra. Lo de cada persona va por el cliente (/api/events/[id]/viewer, /api/sites/likes).
const FILES = [
  "presentation/sites/components/detail/SiteDetailContainer.tsx",
  "presentation/events/components/EventDetailContainer.tsx",
  "presentation/events/components/SessionDetailContainer.tsx",
  "presentation/events/components/CollectionEventsSection.tsx",
  "presentation/events/components/EventosIndexSections.tsx",
];

for (const file of FILES) {
  test(`${file} no lee la sesión`, () => {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    assert.doesNotMatch(src, /from "next\/headers"/, "cookies()/headers() vuelven el HTML por usuario");
    assert.doesNotMatch(src, /getTokens|getSessionUid|getEventAccess/, "leer la sesión rompe la caché pública");
  });
}
