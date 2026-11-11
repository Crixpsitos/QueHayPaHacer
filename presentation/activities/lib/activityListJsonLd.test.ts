import { test } from "node:test"
import assert from "node:assert/strict"
import { activityListJsonLd, activityListJsonLdHtml } from "./activityListJsonLd"

const o = { siteUrl: "https://x.co", path: "/actividades-gratis-ibague", name: "Gratis", items: [{ slug: "a", title: "A" }, { slug: "b", title: "</script>B" }] }

test("ItemList con posiciones y URLs absolutas a cada ficha", () => {
  const [list] = activityListJsonLd(o) as { itemListElement: { position: number; url: string }[] }[]
  assert.deepEqual(list.itemListElement.map((i) => [i.position, i.url]), [[1, "https://x.co/actividades/a"], [2, "https://x.co/actividades/b"]])
})
test("migas: Inicio → Actividades → la landing", () => {
  const [, crumbs] = activityListJsonLd(o) as { itemListElement: { name: string }[] }[]
  assert.deepEqual(crumbs.itemListElement.map((i) => i.name), ["Inicio", "Actividades", "Gratis"])
})
test("el HTML no puede cerrar el script", () => assert.ok(!activityListJsonLdHtml(o).includes("</script>")))
