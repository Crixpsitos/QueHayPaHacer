import { test } from "node:test"
import assert from "node:assert/strict"
import { makeActivity, makeImage } from "@/domain/entities/activities/activity.fixture"
import { toPublicView } from "./publicView"
import { activityJsonLd, activityJsonLdHtml } from "./activityJsonLd"

const view = (p = {}) => ({ ...toPublicView(makeActivity(p)), site: null })

test("Service con proveedor, zona, imagen y una oferta por opción de precio (COP)", () => {
  const [svc] = activityJsonLd(view({ priceOptions: [{ label: "Completa", amountCop: 40000, unit: "persona", includes: [] }, { label: "Solo caminata", amountCop: 25000, unit: "persona", includes: [] }], media: [makeImage("a", true)] }), "https://q.test")
  assert.equal(svc["@type"], "TouristAttraction") // categoría aire-libre
  assert.equal(svc.url, "https://q.test/actividades/senderismo-los-domingos")
  assert.deepEqual(svc.provider, { "@type": "Organization", name: "Club Cerros" })
  assert.deepEqual(svc.areaServed, { "@type": "City", name: "Ibagué" })
  assert.deepEqual((svc.image as string[])[0], "https://x.test/a.jpg")
  assert.deepEqual((svc.offers as { price: number; priceCurrency: string }[]).map((o) => [o.price, o.priceCurrency]), [[40000, "COP"], [25000, "COP"]])
})

test("las demás categorías son Service y no hay AggregateRating todavía", () => {
  const [svc] = activityJsonLd(view({ category: "en-familia" }), "https://q.test")
  assert.equal(svc["@type"], "Service")
  assert.equal("aggregateRating" in svc, false)
})

test("migas de pan: Inicio → Actividades → título", () => {
  const crumbs = activityJsonLd(view(), "https://q.test")[1] as { itemListElement: { position: number; name: string; item: string }[] }
  assert.deepEqual(crumbs.itemListElement.map((c) => [c.position, c.name]), [[1, "Inicio"], [2, "Actividades"], [3, "Senderismo los domingos"]])
  assert.equal(crumbs.itemListElement[2].item, "https://q.test/actividades/senderismo-los-domingos")
})

test("el HTML del script escapa < para que un título no cierre la etiqueta", () => {
  const html = activityJsonLdHtml(view({ title: "Salida </script><b>x" }), "https://q.test")
  assert.ok(!html.includes("</script>"))
  assert.ok(html.includes("\\u003c"))
  assert.doesNotThrow(() => JSON.parse(html))
})
