import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionViewModelMapper } from "./SessionViewModelMapper";
import type { EventSession } from "@/domain/entities/events/EventSession";
import type { EventViewModel } from "../view-models/EventViewModel";

function makeSession(over: Partial<EventSession>): EventSession {
  return {
    id: "s1",
    eventId: "e1",
    coverSource: "own",
    media: [],
    location: { city: { name: "", slug: "" }, venue: "", address: "", department: { isoCode: "", name: "", slug: "" }, country: { isoCode: "", name: "", slug: "" }, coordinates: { lat: 0, lng: 0 } },
    startDate: new Date("2026-12-07T20:00:00Z"),
    endDate: new Date("2026-12-07T23:00:00Z"),
    registrationType: "none",
    price: { isFree: true, amount: 0, currency: "COP" },
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as EventSession;
}

test("cover resolution: own / parent / sibling { sessionId }", () => {
  const own = makeSession({ id: "a", coverSource: "own", mainImage: { url: "own.jpg" } });
  const parent = makeSession({ id: "b", coverSource: "parent" });
  const ref = makeSession({ id: "c", coverSource: { sessionId: "a" } });

  const vms = SessionViewModelMapper.toViewModels([own, parent, ref], "parent.jpg");

  assert.equal(vms.find((v) => v.id === "a")?.coverUrl, "own.jpg");
  assert.equal(vms.find((v) => v.id === "b")?.coverUrl, "parent.jpg");
  assert.equal(vms.find((v) => v.id === "c")?.coverUrl, "own.jpg"); // hereda de "a"
});

test("toEventViewModel: id/autor/analíticas del padre, lugar/fechas/precio de la sesión", () => {
  const parent = {
    id: "event-parent",
    slug: "mi-evento",
    title: "Festival",
    author: { id: "u1", displayName: "Org", photoURL: "" },
    analytics: { likes: 42 },
    mainImage: { url: "hero.jpg" },
    media: [],
    price: { isFree: false, amount: 5, currency: "USD" },
  } as unknown as EventViewModel;

  const sessionVM = SessionViewModelMapper.toViewModel(
    makeSession({ id: "s9", title: "Noche 1", price: { isFree: true, amount: 0, currency: "COP" } }),
    parent.mainImage?.url,
  );

  const merged = SessionViewModelMapper.toEventViewModel(sessionVM, parent);

  assert.equal(merged.id, "event-parent"); // like/registro apuntan al padre
  assert.equal(merged.author.id, "u1");
  assert.equal(merged.analytics?.likes, 42);
  assert.equal(merged.title, "Noche 1");
  assert.equal(merged.price.isFree, true); // precio de la sesión, no del padre
  assert.equal(merged.eventType, "standard"); // fuerza layout estándar
  assert.equal(merged.startDate, new Date("2026-12-07T20:00:00Z").toISOString());
});
