import { test } from "node:test"
import assert from "node:assert/strict"
import { timeAgoEs } from "./timeAgo"

const MIN = 60_000
const DAY = 24 * 60 * MIN

test("timeAgoEs elige la unidad y el plural", () => {
  assert.equal(timeAgoEs(0, 10_000), "hace un momento")
  assert.equal(timeAgoEs(0, MIN), "hace 1 minuto")
  assert.equal(timeAgoEs(0, 5 * MIN), "hace 5 minutos")
  assert.equal(timeAgoEs(0, 3 * 60 * MIN), "hace 3 horas")
  assert.equal(timeAgoEs(0, DAY), "hace 1 día")
  assert.equal(timeAgoEs(0, 12 * DAY), "hace 12 días")
  assert.equal(timeAgoEs(0, 65 * DAY), "hace 2 meses")
  assert.equal(timeAgoEs(0, 400 * DAY), "hace 1 año")
  assert.equal(timeAgoEs(10 * MIN, 0), "hace un momento")
})
