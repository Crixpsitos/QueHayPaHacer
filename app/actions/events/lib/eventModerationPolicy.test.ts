import assert from "node:assert/strict";
import { test } from "node:test";
import type { User } from "@/domain/entities/user/User";
import { moderationFieldsForSubmission } from "./eventModerationPolicy";

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