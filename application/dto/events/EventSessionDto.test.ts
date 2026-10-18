import assert from "node:assert/strict";
import { test } from "node:test";
import { safeParse } from "valibot";
import { SessionSchema } from "./EventSessionDto";

const baseSession = {
  title: "Concierto nocturno",
  description: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Descripción válida del evento" }] }],
  },
  coverSource: "parent" as const,
  media: [],
  location: {
    country: { isoCode: "CO", name: "Colombia", slug: "colombia" },
    department: { isoCode: "TOL", name: "Tolima", slug: "tolima" },
    city: { name: "Ibagué", slug: "ibague" },
    venue: "Teatro Tolima",
    address: "Carrera 3 # 11-60",
    coordinates: { lat: 4.4389, lng: -75.2322 },
  },
  startDate: "2026-10-10T18:00:00.000Z",
  endDate: "2026-10-10T21:00:00.000Z",
  externalUrl: undefined,
  registrationEventForm: { fields: [] },
  price: { isFree: true, amount: 0, currency: "COP" },
  status: "published" as const,
};

test("a free multi-date session supports internal registration", () => {
  const result = safeParse(SessionSchema, {
    ...baseSession,
    registrationType: "internal",
  });

  assert.equal(result.success, true);
});

test("a paid multi-date session rejects internal registration", () => {
  const result = safeParse(SessionSchema, {
    ...baseSession,
    registrationType: "internal",
    price: { isFree: false, amount: 50_000, currency: "COP" },
  });

  assert.equal(result.success, false);
  assert.match(result.issues?.map((issue) => issue.message).join(" ") ?? "", /registro externo/i);
});

test("a paid multi-date session requires an external URL", () => {
  const result = safeParse(SessionSchema, {
    ...baseSession,
    registrationType: "external",
    price: { isFree: false, amount: 50_000, currency: "COP" },
  });

  assert.equal(result.success, false);
  assert.match(result.issues?.map((issue) => issue.message).join(" ") ?? "", /URL externa/i);
});

test("a paid multi-date session accepts external registration with URL", () => {
  const result = safeParse(SessionSchema, {
    ...baseSession,
    registrationType: "external",
    externalUrl: "https://tickets.example.com/evento",
    price: { isFree: false, amount: 50_000, currency: "COP" },
  });

  assert.equal(result.success, true);
});