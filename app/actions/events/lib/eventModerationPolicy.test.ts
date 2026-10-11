import assert from "node:assert/strict";
import { test } from "node:test";
import type { Events } from "@/domain/entities/events/Events";
import type { User } from "@/domain/entities/user/User";
import { enforcePlanFeatures, moderationFieldsForSubmission, optimizedPathFor, withServerOwnedFields } from "./eventModerationPolicy";

const submittedAt = new Date("2026-01-15T12:00:00.000Z");

function author(creatorVerified: boolean): User {
  return { creatorVerified } as User;
}

test("unverified authors require approval before publication", () => {
  assert.deepEqual(moderationFieldsForSubmission(author(false), submittedAt), {
    status: "pending",
    moderationStatus: "pending",
    moderationMode: "pre_publication",
    rejectionReason: null,
    submittedAt,
    reviewedAt: null,
    reviewedBy: null,
    publishedAt: undefined,
  });
});

test("verified creators publish while awaiting a later audit", () => {
  assert.deepEqual(moderationFieldsForSubmission(author(true), submittedAt), {
    status: "published",
    moderationStatus: "pending_audit",
    moderationMode: "post_publication",
    rejectionReason: null,
    submittedAt,
    reviewedAt: null,
    reviewedBy: null,
    publishedAt: submittedAt,
  });
});
test("client payload never overwrites server-owned event fields", () => {
  const createdAt = new Date("2025-01-01T00:00:00.000Z");
  const existing = {
    id: "e1", slug: "evento-e1", title: "Viejo", status: "published", eventType: "standard",
    author: { id: "u1", displayName: "Ana", photoURL: "" },
    analytics: { score: 42, views: 7 }, createdAt, metadata: { isFirstEvent: true },
    promotion: { isPromoted: false }, moderationStatus: "approved",
  } as unknown as Events;
  const incoming = {
    id: "otro", slug: "hack", title: "Nuevo", status: "draft", eventType: "multi-date",
    author: { id: "u2" }, analytics: undefined, createdAt: new Date(),
    promotion: { isPromoted: true }, moderationStatus: "pending",
  } as unknown as Events;

  const merged = withServerOwnedFields(existing, incoming);
  assert.equal(merged.title, "Nuevo");
  assert.equal(merged.id, "e1");
  assert.equal(merged.slug, "evento-e1");
  assert.equal(merged.author.id, "u1");
  assert.equal(merged.eventType, "standard");
  assert.equal(merged.status, "published");
  assert.equal(merged.moderationStatus, "approved");
  assert.equal(merged.promotion.isPromoted, false);
  assert.deepEqual(merged.analytics, { score: 42, views: 7 });
  assert.equal(merged.createdAt, createdAt);
});

test("optimizedPathFor reproduce el nombre del optimizador", () => {
  assert.equal(
    optimizedPathFor("public/events/abc/images/deoptimized-main-image-qa-cover2.jpg-9f0ba166-3e11"),
    "public/events/abc/images/optimized_main-image-qa-cover2.webp",
  )
})

test("enforcePlanFeatures: sin Premium apaga asistencia y baja form a inscripción interna", () => {
  const event = { requiresAttendance: true, registrationType: "form" as const, registrationEventForm: { fields: [{ id: "a" }] } };
  const basic = enforcePlanFeatures(event, { plan: "basic" });
  assert.equal(basic.requiresAttendance, false);
  assert.equal(basic.registrationType, "internal");
  assert.equal(basic.registrationEventForm, undefined);
  assert.equal(enforcePlanFeatures({ registrationType: "internal" as const }, null).registrationType, "internal");
  assert.deepEqual(enforcePlanFeatures(event, { plan: "premium" }), event);
});
