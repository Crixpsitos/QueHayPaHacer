import { test } from "node:test"
import assert from "node:assert/strict"
import { siteTagsToRevalidate, tagsForChangedSites } from "./siteTags"

test("la lista base es la misma de /api/sites/revalidate", () => {
  assert.deepEqual(siteTagsToRevalidate("abc"), ["site-abc", "site-list", "featured-sites", "explore"])
})

test("suma los tags del autor (Mis sitios y perfil), sin repetidos ni vacíos", () => {
  assert.deepEqual(siteTagsToRevalidate("abc", ["u1", null, undefined, "u1", "u2"]), [
    "site-abc",
    "site-list",
    "featured-sites",
    "explore",
    "sites-u1",
    "profile-sites-u1",
    "sites-u2",
    "profile-sites-u2",
  ])
})

test("varios sitios: los tags generales salen una sola vez", () => {
  const tags = tagsForChangedSites([
    { siteId: "a", authorId: "u1" },
    { siteId: "b", authorId: "u1" },
    { siteId: "c", authorId: null },
  ])
  assert.deepEqual(tags, ["site-a", "site-list", "featured-sites", "explore", "sites-u1", "profile-sites-u1", "site-b", "site-c"])
  assert.equal(tags.filter((t) => t === "site-list").length, 1)
})

test("sin sitios cambiados no hay nada que invalidar", () => {
  assert.deepEqual(tagsForChangedSites([]), [])
})
