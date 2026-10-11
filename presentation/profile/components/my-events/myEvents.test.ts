import assert from "node:assert/strict";
import test from "node:test";

import type { UserEvent } from "@/domain/repository/profile/IProfileRepository";
import { conversion, eventKind, sortEvents, totals } from "./myEvents";

const ev = (id: string, over: Partial<UserEvent>): UserEvent => ({
  id,
  title: id,
  description: "",
  status: "published",
  moderationStatus: "approved",
  moderationMode: "pre_publication",
  createdAt: new Date("2026-01-01"),
  ...over,
});

const NOW = new Date("2026-10-10T12:00:00Z").getTime();

test("eventKind prioriza rechazo y respeta draft/pending", () => {
  assert.equal(eventKind({ status: "published", moderationStatus: "rejected" }), "rejected");
  assert.equal(eventKind({ status: "draft", moderationStatus: "pending" }), "draft");
  assert.equal(eventKind({ status: "pending", moderationStatus: "pending" }), "review");
  assert.equal(eventKind({ status: "published", moderationStatus: "pending_audit" }), "published");
});

test("sortEvents: próximos (más cercano primero), luego borradores, luego pasados", () => {
  const sorted = sortEvents(
    [
      ev("past", { startDate: new Date("2026-01-01") }),
      ev("draft", { status: "draft" }),
      ev("later", { startDate: new Date("2026-12-01") }),
      ev("soon", { startDate: new Date("2026-10-20") }),
    ],
    NOW,
  );
  assert.deepEqual(sorted.map((e) => e.id), ["soon", "later", "draft", "past"]);
});

test("totals y conversion no inventan números", () => {
  const t = totals([
    ev("a", { analytics: { views: 100, registrations: 5 } }),
    ev("b", { status: "draft" }),
  ]);
  assert.deepEqual(t, { published: 1, views: 100, registrations: 5 });
  assert.equal(conversion(100, 5), "5 %");
  assert.equal(conversion(0, 5), null);
  assert.equal(conversion(undefined, 5), null);
});
