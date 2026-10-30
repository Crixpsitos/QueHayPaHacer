import assert from "node:assert/strict";
import test from "node:test";

import { SiteFirebaseMapper } from "./SiteFirebaseMapper";
import type { FirebaseSiteDto } from "../../dto/sites/FirebaseSiteDto";

const day = { open: "08:00", close: "18:00", closed: false };
const dto = (marker: unknown) =>
  ({
    id: "s1", slug: "s", name: "Sitio", category: "other", description: "d",
    location: { address: "Calle 1", geo: { latitude: 4.4, longitude: -75.2 }, city: { name: "Ibagué" } },
    media: [{ id: "m1", type: "image", isCover: true, url: "https://x.test/real.webp", markerUrl: marker }],
    schedule: { monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: day },
    author: { id: "a", displayName: "A", photoURL: "" },
    analytics: {}, publicationStatus: "published", moderationStatus: "approved", isActive: true,
  }) as unknown as FirebaseSiteDto;

test("toSiteDetail: coverUrl es la portada real, no el marcador de 40 px", () => {
  const s = new SiteFirebaseMapper().toSiteDetail(dto({ url: "https://x.test/marker.webp", path: "p" }));
  assert.equal(s.coverUrl, "https://x.test/real.webp");
  assert.equal(s.markerUrl, "https://x.test/marker.webp");
});

test("toSiteDetail: sin marcador, markerUrl queda vacío y coverUrl no cambia", () => {
  const s = new SiteFirebaseMapper().toSiteDetail(dto(null));
  assert.equal(s.coverUrl, "https://x.test/real.webp");
  assert.equal(s.markerUrl, undefined);
});
