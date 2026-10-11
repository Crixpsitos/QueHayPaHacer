import assert from "node:assert/strict";
import test from "node:test";

import type {
  UserBadge,
  UserEvent,
  UserEventInteraction,
  UserSite,
} from "@/domain/repository/profile/IProfileRepository";
import { buildProfileTimelineItems, groupProfileTimelineItems } from "./profileTimeline";

const event = (id: string, status: string, createdAt: string): UserEvent => ({
  id,
  title: `Evento ${id}`,
  description: "Descripción",
  status,
  moderationStatus: "approved",
  moderationMode: "post_publication",
  createdAt: new Date(createdAt),
});

const site = (id: string, publicationStatus: "draft" | "published", createdAt: string): UserSite => ({
  id,
  slug: id,
  name: `Sitio ${id}`,
  address: "Ibagué",
  category: "cafe",
  createdAt: new Date(createdAt),
  publicationStatus,
  moderationStatus: "approved",
  analytics: { views: 0, likes: 0, eventCount: 0 },
});

const interaction = (
  id: string,
  type: UserEventInteraction["type"],
  createdAt: string,
): UserEventInteraction => ({
  id,
  eventId: `event-${id}`,
  type,
  createdAt: new Date(createdAt),
});

const badge = (id: string, earnedAt: string): UserBadge => ({
  id,
  name: `Insignia ${id}`,
  description: "Descripción",
  category: "achievement",
  earnedAt: new Date(earnedAt),
});

test("buildProfileTimelineItems ordena la actividad más reciente primero", () => {
  const items = buildProfileTimelineItems({
    events: [event("old", "published", "2026-01-01")],
    sites: [site("new", "published", "2026-04-01")],
    likes: [interaction("middle", "like", "2026-03-01")],
    badges: [badge("badge", "2026-02-01")],
  });

  assert.deepEqual(
    items.map((item) => item.type),
    ["site", "like", "badge", "event"],
  );
});

test("buildProfileTimelineItems excluye borradores y acciones que no son likes", () => {
  const items = buildProfileTimelineItems({
    events: [event("draft", "draft", "2026-04-01")],
    sites: [site("draft", "draft", "2026-04-02")],
    likes: [
      interaction("comment", "comment", "2026-04-03"),
      interaction("share", "share", "2026-04-04"),
      interaction("like", "like", "2026-04-05"),
    ],
    badges: [],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].type, "like");
});

test("groupProfileTimelineItems agrupa por día calendario de Bogotá sin alterar el orden", () => {
  const items = buildProfileTimelineItems({
    events: [event("morning", "published", "2026-08-07T14:00:00.000Z")],
    sites: [site("night", "published", "2026-08-08T02:15:00.000Z")],
    likes: [interaction("previous", "like", "2026-08-07T04:30:00.000Z")],
    badges: [],
  });

  const groups = groupProfileTimelineItems(items);

  assert.deepEqual(groups.map((group) => group.dateKey), ["2026-08-07", "2026-08-06"]);
  assert.deepEqual(groups[0].items.map((item) => item.id), ["site-night", "event-morning"]);
  assert.deepEqual(groups[1].items.map((item) => item.id), ["like-previous"]);
});
