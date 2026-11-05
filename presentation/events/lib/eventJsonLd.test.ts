import { test } from "node:test"
import assert from "node:assert/strict"
import { buildEventJsonLd } from "./eventJsonLd"
import type { EventViewModel } from "../view-models/EventViewModel"

const base = {
  id: "e1",
  slug: "candlelight-navidad",
  title: "Candlelight Navidad",
  shortDescription: "Cuarteto de cuerdas a la luz de las velas",
  startDate: "2026-12-10T19:00:00.000Z",
  endDate: "2026-12-10T21:00:00.000Z",
  status: "published",
  eventType: "single",
  capacity: 100,
  price: { isFree: false, amount: 80000, currency: "COP" },
  mainImage: { url: "https://cdn.test/img.webp" },
  author: { id: "u1", displayName: "Que hay pa hacer", photoURL: "" },
  categoryInfo: { id: "music", title: "Música", tags: ["concierto", "navidad"] },
  location: {
    venue: "Conservatorio del Tolima",
    address: "Calle 9 #1-18",
    city: { name: "Ibagué" },
    department: { name: "Tolima" },
    country: { name: "Colombia" },
    coordinates: { lat: 4.43, lng: -75.2 },
  },
} as unknown as EventViewModel

test("evento simple: campos clave y URLs absolutas", () => {
  const ld = buildEventJsonLd(base) as Record<string, any>
  assert.equal(ld["@type"], "Event")
  assert.equal(ld.name, "Candlelight Navidad")
  assert.equal(ld.eventStatus, "https://schema.org/EventScheduled")
  assert.match(ld.url, /^https?:\/\/.+\/eventos\/candlelight-navidad$/)
  assert.equal(ld.offers.url, ld.url)
  assert.equal(ld.offers.price, "80000")
  assert.equal(ld.offers.availability, "https://schema.org/InStock")
  assert.equal(ld.location.address.addressLocality, "Ibagué")
  assert.equal(ld.keywords, "concierto, navidad")
})

test("gratis → precio 0; cupo lleno → SoldOut", () => {
  const free = buildEventJsonLd({ ...base, price: { isFree: true, amount: 0 } } as unknown as EventViewModel) as any
  assert.equal(free.offers.price, "0")
  const full = buildEventJsonLd(base, { attendeeCount: 100 }) as any
  assert.equal(full.offers.availability, "https://schema.org/SoldOut")
})

test("cancelado y aplazado se reflejan", () => {
  assert.equal((buildEventJsonLd({ ...base, status: "cancelled" } as unknown as EventViewModel) as any).eventStatus, "https://schema.org/EventCancelled")
  assert.equal((buildEventJsonLd({ ...base, status: "draft" } as unknown as EventViewModel) as any).eventStatus, "https://schema.org/EventPostponed")
})

test("multi-fecha: sin ubicación ni oferta (viven en las sesiones)", () => {
  const ld = buildEventJsonLd({ ...base, eventType: "multi-date" } as unknown as EventViewModel) as any
  assert.equal(ld.offers, undefined)
  assert.equal(ld.location, undefined)
})
