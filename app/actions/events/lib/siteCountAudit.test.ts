import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// Auditoría de huecos (docs/27): cada camino que cambia si un evento cuenta para un sitio debe recontar.
// Este test falla si alguno deja de hacerlo. Es estático (lee el código fuente), como siteLinkGuard.test.ts.
const read = (rel: string) => readFileSync(new URL(`../../../../${rel}`, import.meta.url), "utf8")

// Acciones que recuentan directamente.
const DIRECT: [string, string][] = [
  ["app/actions/events/publish-event.action.ts", "refreshSitesOfEvent("],
  ["app/actions/events/update-event.action.ts", "refreshSitesOfEvent("],
  ["app/actions/events/delete-event.action.ts", "refreshSitesOfEvent("],
  ["app/actions/events/migrate-event-type.action.ts", "refreshSitesOfEvent("],
  ["app/actions/events/lib/syncEventSiteIds.ts", "refreshSitesOfEvent("],
  ["app/api/events/moderation/route.ts", "refreshSiteEventCounts("],
  ["app/api/events/revalidate/route.ts", "refreshSiteEventCounts("],
]
for (const [file, call] of DIRECT) {
  test(`${file} recuenta los sitios (${call})`, () => assert.ok(read(file).includes(call)))
}

// Acciones de sesión: pasan por afterSessionChange, que sincroniza fechas y sitios (y recuenta).
const VIA_SESSION_HOOK = [
  "create-event-session",
  "update-event-session",
  "delete-event-session",
  "set-session-status",
  "save-draft-session",
]
for (const name of VIA_SESSION_HOOK) {
  test(`${name}.action.ts llama a afterSessionChange`, () => assert.ok(read(`app/actions/events/${name}.action.ts`).includes("afterSessionChange(")))
}

test("afterSessionChange sincroniza fechas ANTES que sitios, y sitios recuenta", () => {
  const src = read("app/actions/events/lib/sessionOwnership.ts")
  const dates = src.indexOf("await syncEventDateRange(")
  const sites = src.indexOf("await syncEventSiteIds(")
  assert.ok(dates > 0 && sites > dates, "primero syncEventDateRange y después syncEventSiteIds")
})

// Ninguna otra acción debería tocar estado, fechas o sitio de un evento sin pasar por lo anterior.
test("las acciones de Studio no cambian estado, fechas ni sitio de un evento", () => {
  for (const f of ["invite-collaborators", "remove-collaborator", "change-collaborator-role", "confirm-attendance", "check-in-by-code", "remove-participant"]) {
    const src = read(`app/actions/studio/${f}.action.ts`)
    assert.ok(!/status:|location\.siteId|startDate|endDate|siteIds/.test(src), `${f} toca campos que cuentan para un sitio`)
  }
})

test("el barrido está cableado y una sola lista de tags se comparte", () => {
  assert.ok(read("app/api/sites/recompute-expired/route.ts").includes("tagsForChangedSites("))
  assert.ok(read("app/api/sites/revalidate/route.ts").includes("siteTagsToRevalidate("))
  assert.ok(read("app/lib/sites/siteEvents.ts").includes("tagsForChangedSites("))
})

test("todo sitio nuevo nace con eventCountValidUntil en null", () => {
  assert.ok(read("app/actions/sites/buildSiteInput.ts").includes("eventCountValidUntil: null"))
  assert.ok(read("infraestructure/firebase/mappers/sites/SiteFirebaseMapper.ts").includes("eventCountValidUntil: null"))
})
