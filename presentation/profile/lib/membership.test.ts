import assert from "node:assert/strict";
import test from "node:test";

import { MEMBERSHIP_PLANS, getMembershipPlan } from "./membership";

test("muestra labels en español para los valores técnicos del plan", () => {
  assert.equal(MEMBERSHIP_PLANS.basic.label, "Básico");
  assert.equal(MEMBERSHIP_PLANS.premium.label, "Premium");
  assert.equal(getMembershipPlan().id, "basic");
});

test("Premium contiene únicamente los beneficios definidos", () => {
  assert.deepEqual(
    MEMBERSHIP_PLANS.premium.features.map(({ label }) => label),
    [
      "Todo lo incluido en Básico",
      "Eventos multifecha",
      "Formularios personalizados",
      "Studio y analíticas avanzadas",
      "Gestión de colaboradores",
      "Soporte prioritario",
    ],
  );
  assert.equal(
    MEMBERSHIP_PLANS.premium.features.find(({ id }) => id === "priority-support")?.comingSoon,
    true,
  );
});

test("no inventa precio ni terminología profesional", () => {
  const catalogText = JSON.stringify(MEMBERSHIP_PLANS);
  assert.doesNotMatch(catalogText, /professional|profesional/i);
});