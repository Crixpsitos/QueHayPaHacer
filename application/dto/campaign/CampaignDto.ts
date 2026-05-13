import * as v from "valibot";
import { CampaignEntityType } from "@/domain/entities/campaign/CampaignEntityType";
import { CampaignStatus } from "@/domain/entities/campaign/CampaignStatus";

const ImageSchema = v.object({
  url: v.pipe(v.string(), v.url("Invalid image URL")),
  width: v.pipe(v.number(), v.minValue(0, "width must be non-negative")),
  height: v.pipe(v.number(), v.minValue(0, "height must be non-negative")),
  alt: v.string(),
});

const ImageVariantsSchema = v.object({
  desktop: ImageSchema,
  mobile: ImageSchema,
  tablet: ImageSchema,
});

export const CampaignSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("id is required")),
  title: v.pipe(v.string(), v.nonEmpty("title is required")),
  description: v.optional(v.string()),
  entityType: v.enum(CampaignEntityType, "Invalid entity type"),
  status: v.enum(CampaignStatus, "Invalid status"),
  priority: v.pipe(v.number(), v.minValue(0, "priority must be non-negative")),
  images: ImageVariantsSchema,
  isSponsored: v.optional(v.boolean()),
  cta: v.optional(
    v.array(
      v.object({
        label: v.pipe(v.string(), v.nonEmpty("cta label is required")),
        href: v.pipe(v.string(), v.url("Invalid URL")),
      })
    )
  ),
  entity: v.optional(
    v.object({
      id: v.pipe(v.string(), v.nonEmpty("entity id is required")),
      slug: v.pipe(v.string(), v.nonEmpty("entity slug is required")),
    })
  ),
  schedule: v.optional(
    v.object({
      startAt: v.pipe(v.string(), v.nonEmpty("startAt is required")),
      endAt: v.pipe(v.string(), v.nonEmpty("endAt is required")),
    })
  ),
  analytics: v.optional(
    v.object({
      views: v.pipe(v.number(), v.minValue(0, "views must be non-negative")),
      clicks: v.pipe(v.number(), v.minValue(0, "clicks must be non-negative")),
    })
  ),
  createdAt: v.pipe(v.string(), v.nonEmpty("createdAt is required")),
  updatedAt: v.pipe(v.string(), v.nonEmpty("updatedAt is required")),
});

export type CampaignDto = v.InferOutput<typeof CampaignSchema>;
