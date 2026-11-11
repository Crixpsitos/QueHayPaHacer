import { test } from "node:test"
import assert from "node:assert/strict"
import { mediaOwnershipError } from "./ActivityMedia"
import { makeImage } from "../activity.fixture"

const good = (id = "a1") => makeImage("m1", true, { path: `public/activities/${id}/images/m1.jpg`, url: "https://storage.googleapis.com/b/public/activities/a1/images/m1.jpg" })

test("medios bajo la carpeta de la actividad y servidos desde Storage son válidos", () => {
  assert.equal(mediaOwnershipError("a1", [good()]), null)
  assert.equal(mediaOwnershipError("a1", []), null)
})

test("rechaza medios de otra actividad, rutas con .. o subcarpetas, y enlaces externos", () => {
  assert.notEqual(mediaOwnershipError("a1", [good("otra")]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), path: "public/activities/a1/images/../../x.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), path: "public/activities/a1/images/sub/m1.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), url: "https://evil.com/x.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), url: "https://storage.googleapis.com.evil.com/x.jpg" }]), null)
})

test("la carpeta debe coincidir con el tipo (imagen en images, video en videos)", () => {
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), type: "video" }]), null)
  assert.equal(mediaOwnershipError("a1", [{ ...good(), type: "video", path: "public/activities/a1/videos/v.mp4" }]), null)
})
