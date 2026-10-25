import { test } from "node:test"
import assert from "node:assert/strict"
import { canLinkEventToSite, isLinkableSite, SITE_LINK_ERROR, siteLinkViolation, type SiteLinkSnapshot } from "./siteLink"

const own: SiteLinkSnapshot = {
  authorId: "u1",
  publishedAs: "owner",
  verification: "claimed",
  publicationStatus: "published",
  moderationStatus: "approved",
}

test("el dueño puede vincular su sitio publicado y aprobado (reclamado o verificado)", () => {
  assert.equal(canLinkEventToSite(own, "u1"), true)
  assert.equal(canLinkEventToSite({ ...own, verification: "verified" }, "u1"), true)
})

test("un sitio ajeno no se puede vincular", () => {
  assert.equal(canLinkEventToSite(own, "otro"), false)
  assert.equal(canLinkEventToSite({ ...own, authorId: null }, "u1"), false)
})

test("los sitios propuestos por la comunidad y los de QHPA quedan fuera, aunque sean del autor", () => {
  assert.equal(canLinkEventToSite({ ...own, publishedAs: "proposer", verification: "community" }, "u1"), false)
  assert.equal(canLinkEventToSite({ ...own, publishedAs: "qhpa" }, "u1"), false)
})

test("un doc antiguo sin publishedAs se lee como propuesto: no es vinculable", () => {
  assert.equal(canLinkEventToSite({ authorId: "u1", publicationStatus: "published", moderationStatus: "approved" }, "u1"), false)
})

test("owner sin campo verification se lee como reclamado; community nunca", () => {
  assert.equal(canLinkEventToSite({ ...own, verification: undefined }, "u1"), true)
  assert.equal(canLinkEventToSite({ ...own, verification: "community" }, "u1"), false)
})

test("solo publicado y aprobado: borrador, pendiente o rechazado no", () => {
  assert.equal(canLinkEventToSite({ ...own, publicationStatus: "draft" }, "u1"), false)
  assert.equal(canLinkEventToSite({ ...own, moderationStatus: "pending" }, "u1"), false)
  assert.equal(canLinkEventToSite({ ...own, moderationStatus: "rejected" }, "u1"), false)
})

test("sitio inexistente o sin uid: no", () => {
  assert.equal(canLinkEventToSite(null, "u1"), false)
  assert.equal(canLinkEventToSite(undefined, "u1"), false)
  assert.equal(canLinkEventToSite(own, ""), false)
})

test("isLinkableSite: no mira el autor, solo la declaración y el estado", () => {
  const { authorId: _a, ...rest } = own
  void _a
  assert.equal(isLinkableSite(rest), true)
  assert.equal(isLinkableSite({ ...rest, publishedAs: "proposer" }), false)
  assert.equal(isLinkableSite({ ...rest, moderationStatus: "pending" }), false)
})

test("siteLinkViolation solo valida vínculos nuevos o cambiados", async () => {
  const lookups: string[] = []
  const get = async (id: string) => {
    lookups.push(id)
    return id === "propio" ? own : { ...own, publishedAs: "proposer" as const, verification: "community" as const }
  }
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: "propio", previousSiteId: null }, get), null)
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: "propuesto", previousSiteId: null }, get), SITE_LINK_ERROR)
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: "propuesto", previousSiteId: "propuesto" }, get), null, "mismo vínculo ya guardado: se respeta")
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: "propuesto", previousSiteId: "propio" }, get), SITE_LINK_ERROR, "cambia a uno no elegible")
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: null, previousSiteId: "propuesto" }, get), null, "quitar el vínculo siempre se puede")
  assert.equal(await siteLinkViolation({ ownerId: "otro", nextSiteId: "propio" }, get), SITE_LINK_ERROR, "sitio de otra persona")
  assert.equal(await siteLinkViolation({ ownerId: "u1", nextSiteId: "no-existe" }, async () => null), SITE_LINK_ERROR)
  assert.deepEqual(lookups, ["propio", "propuesto", "propuesto", "propio"], "sin vínculo nuevo no lee el sitio")
})
