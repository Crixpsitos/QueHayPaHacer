import assert from "node:assert/strict";
import test from "node:test";

import { ProfileFirebaseMapper } from "./ProfileFirebaseMapper";

const mapper = new ProfileFirebaseMapper();

test("toUserEvent prefiere la variante desktop procesada", () => {
  const event = mapper.toUserEvent({
    id: "event-1",
    data: {
      title: "Evento",
      status: "published",
      createdAt: new Date("2026-08-07T14:00:00.000Z"),
      mainImage: {
        url: "https://example.com/legacy-small.jpg",
        desktop: { url: "https://example.com/event-desktop.jpg" },
      },
    },
  });

  assert.equal(event.image, "https://example.com/event-desktop.jpg");
});

test("toUserSite conserva la portada original en lugar de la miniatura", () => {
  const site = mapper.toUserSite({
    id: "site-1",
    data: {
      name: "Sitio",
      slug: "sitio",
      createdAt: new Date("2026-08-07T14:00:00.000Z"),
      media: [
        {
          isCover: true,
          url: "https://example.com/site-original.jpg",
          thumbnailUrl: "https://example.com/site-thumbnail.jpg",
        },
      ],
    },
  });

  assert.equal(site.coverUrl, "https://example.com/site-original.jpg");
});