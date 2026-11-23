import { test } from "node:test"
import assert from "node:assert/strict"
import { SitesService } from "./SitesService"
import type { SitesAdapter } from "@/infraestructure/adapters/sites/SitesAdapter"

const svc = () => new SitesService({} as unknown as SitesAdapter)

test("un sitio de una cuenta sin confianza queda pendiente", () => {
  assert.deepEqual(svc().moderationFor(), { moderationStatus: "pending" })
})

test("una cuenta de confianza publica aprobada y activa; la auditoría queda marcada como «auto»", () => {
  assert.deepEqual(svc().moderationFor(undefined, true), { moderationStatus: "approved", isActive: true, reviewedBy: "auto" })
})

test("el admin aprueba a su nombre aunque también sea de confianza", () => {
  assert.deepEqual(svc().moderationFor("admin1", true), { moderationStatus: "approved", isActive: true, reviewedBy: "admin1" })
})
