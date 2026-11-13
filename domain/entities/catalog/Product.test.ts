import { test } from "node:test"
import assert from "node:assert/strict"
import { discountPercent, groupBySection, productPrice, validateProducts, cop, type Product } from "./Product"

const p = (o: Partial<Product> = {}): Product => ({ id: "a", name: "Helado de maracuyá", description: "Dos bolas.", priceCop: 8500, unit: "porcion", section: "Helados", photoUrl: "", tags: ["sin-gluten"], traces: "", discount: null, ...o })

test("un producto válido pasa", () => assert.equal(validateProducts([p()]), null))
test("rechaza nombre vacío, precio no entero o negativo, unidad inventada", () => {
  assert.ok(validateProducts([p({ name: "  " })]))
  assert.ok(validateProducts([p({ priceCop: 8500.5 })]))
  assert.ok(validateProducts([p({ priceCop: -1 })]))
  assert.ok(validateProducts([p({ unit: "caja" as never })]))
})
test("rechaza enlaces y etiquetas HTML en los textos", () => {
  assert.match(validateProducts([p({ description: "visita www.tienda.com" })]) ?? "", /enlaces/)
  assert.match(validateProducts([p({ name: "<b>x</b>" })]) ?? "", /código/)
})
test("etiquetas: solo del catálogo, sin repetir, y segura/tóxica son excluyentes", () => {
  assert.ok(validateProducts([p({ tags: ["inventada" as never] })]))
  assert.ok(validateProducts([p({ tags: ["vegano", "vegano"] })]))
  assert.ok(validateProducts([p({ tags: ["segura-mascotas", "toxica-mascotas"] })]))
})
test("ids repetidos y tope de 60", () => {
  assert.ok(validateProducts([p(), p()]))
  assert.ok(validateProducts(Array.from({ length: 61 }, (_, i) => p({ id: `x${i}` }))))
})
test("la foto, si existe, debe ser https", () => {
  assert.ok(validateProducts([p({ photoUrl: "http://x.co/a.jpg" })]))
  assert.equal(validateProducts([p({ photoUrl: "https://storage.googleapis.com/x/a.jpg" })]), null)
})
test("descuento: menor al normal y con fecha de fin", () => {
  assert.ok(validateProducts([p({ discount: { priceCop: 9000, until: "2026-12-30" } })]))
  assert.ok(validateProducts([p({ discount: { priceCop: 6800, until: "" } })]))
  assert.equal(validateProducts([p({ discount: { priceCop: 6800, until: "2026-12-30" } })]), null)
})
test("precio de hoy: descuento vigente tacha el normal; vencido no se muestra", () => {
  const d = p({ discount: { priceCop: 6800, until: "2026-12-30" } })
  assert.deepEqual(productPrice(d, "2026-12-30"), { now: 6800, was: 8500 })
  assert.deepEqual(productPrice(d, "2026-12-31"), { now: 8500, was: null })
  assert.equal(discountPercent(8500, 6800), 20)
})
test("agrupa por sección en orden de aparición y deja los sin sección al final", () => {
  const g = groupBySection([p({ id: "1", section: "Bebidas" }), p({ id: "2", section: "" }), p({ id: "3", section: "Helados" }), p({ id: "4", section: "Bebidas" })])
  assert.deepEqual(g.map((x) => [x.section, x.items.length]), [["Bebidas", 2], ["Helados", 1], ["Otros", 1]])
})
test("formato de pesos", () => assert.equal(cop(1234567), "$1.234.567"))
test("la etiqueta «Para llevar» existe y se puede combinar con las de dieta", () => {
  assert.equal(validateProducts([p({ tags: ["para-llevar", "vegano"] })]), null)
})
