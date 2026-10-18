import assert from "node:assert/strict";
import test from "node:test";

import { MEMBERSHIP_PLANS, addMonths, formatCOP, getMembershipPlan } from "./membership";

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
      "Control de asistencia",
      "Studio y analíticas avanzadas",
      "Gestión de colaboradores",
      "Soporte prioritario",
    ],
  );
});

test("precio: Básico gratis, Premium $ 50.000/mes", () => {
  assert.equal(MEMBERSHIP_PLANS.basic.monthlyPriceCOP, null);
  assert.equal(formatCOP(MEMBERSHIP_PLANS.premium.monthlyPriceCOP!), "$ 50.000");
});

test("addMonths no desborda fin de mes", () => {
  assert.equal(addMonths(new Date(2026, 0, 31), 1).toDateString(), new Date(2026, 1, 28).toDateString());
  assert.equal(addMonths(new Date(2026, 10, 15), 3).toDateString(), new Date(2027, 1, 15).toDateString());
});

test("sin terminología profesional", () => {
  const catalogText = JSON.stringify(MEMBERSHIP_PLANS);
  assert.doesNotMatch(catalogText, /professional|profesional/i);
});