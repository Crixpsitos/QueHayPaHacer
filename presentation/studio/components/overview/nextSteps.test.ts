import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNextSteps } from "./nextSteps";
import type { StudioOverviewViewModel } from "../../view-models/StudioOverviewViewModel";

const kpi = (value: number) => ({ label: "", value, previousValue: 0, changePct: 0 });
const base = (over: Partial<StudioOverviewViewModel> = {}): StudioOverviewViewModel => ({
  kpis: { views: kpi(0), registrations: kpi(0), likes: kpi(0), activeEvents: kpi(2) },
  conversion: [],
  registrationsTimeline: [],
  topEvents: [],
  interactivity: [],
  ...over,
});

test("sin datos no inventa sugerencias", () => {
  assert.deepEqual(buildNextSteps(base()), []);
});

test("sin eventos activos lo dice primero", () => {
  const steps = buildNextSteps(base({ kpis: { ...base().kpis, activeEvents: kpi(0) } }));
  assert.equal(steps.length, 1);
  assert.match(steps[0], /No tienes eventos activos/);
});

test("señala peor y mejor conversión, ignora eventos con pocas vistas", () => {
  const steps = buildNextSteps(
    base({
      conversion: [
        { eventId: "a", eventName: "A", views: 100, registrations: 20, rate: 0.2 },
        { eventId: "c", eventName: "Poco", views: 5, registrations: 0, rate: 0 },
        { eventId: "b", eventName: "B", views: 200, registrations: 2, rate: 0.01 },
      ],
    }),
  );
  assert.equal(steps.length, 2);
  assert.match(steps[0], /«B».*\b1\s?%/);
  assert.match(steps[1], /«A».*20\s?%/);
  assert.ok(!steps.join(" ").includes("Poco"));
});
