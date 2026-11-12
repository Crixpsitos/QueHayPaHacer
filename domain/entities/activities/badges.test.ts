import { test } from "node:test"
import assert from "node:assert/strict"
import { activityBadgesFor, ACTIVITY_BADGE_IDS, EXPLORER_MIN_VISITS } from "./badges"

test("sin nada: ninguna insignia", () => assert.deepEqual(activityBadgesFor({ reviews: 0, visits: 0 }), []))
test("primera reseña: «Primera historia»", () => assert.deepEqual(activityBadgesFor({ reviews: 1, visits: 1 }), [ACTIVITY_BADGE_IDS.firstStory]))
test("explorador: desde 5 actividades distintas con «Yo fui»", () => {
  assert.deepEqual(activityBadgesFor({ reviews: 0, visits: EXPLORER_MIN_VISITS - 1 }), [])
  assert.deepEqual(activityBadgesFor({ reviews: 0, visits: EXPLORER_MIN_VISITS }), [ACTIVITY_BADGE_IDS.explorer])
})
test("ambas a la vez, sin repetir", () => assert.deepEqual(activityBadgesFor({ reviews: 3, visits: 9 }).sort(), [ACTIVITY_BADGE_IDS.explorer, ACTIVITY_BADGE_IDS.firstStory].sort()))
