import type { Events } from "@/domain/entities/events/Events";
import type { User } from "@/domain/entities/user/User";

type EventModerationFields = Pick<
  Events,
  | "status"
  | "moderationStatus"
  | "moderationMode"
  | "rejectionReason"
  | "submittedAt"
  | "reviewedAt"
  | "reviewedBy"
  | "publishedAt"
>;

export function moderationFieldsForSubmission(
  author: User,
  submittedAt = new Date(),
): EventModerationFields {
  if (author.creatorVerified) {
    return {
      status: "published",
      moderationStatus: "pending_audit",
      moderationMode: "post_publication",
      rejectionReason: null,
      submittedAt,
      reviewedAt: null,
      reviewedBy: null,
      publishedAt: submittedAt,
    };
  }

  return {
    status: "pending",
    moderationStatus: "pending",
    moderationMode: "pre_publication",
    rejectionReason: null,
    submittedAt,
    reviewedAt: null,
    reviewedBy: null,
    publishedAt: undefined,
  };
}