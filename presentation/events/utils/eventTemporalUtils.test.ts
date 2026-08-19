import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isEventPast,
  isSessionPast,
  isSessionInProgress,
  hasUpcomingSessions,
  isMultiDateEventPast,
} from "./eventTemporalUtils";

// ── Helpers ────────────────────────────────────────────────────────────────

const past = new Date(Date.now() - 60_000).toISOString(); // 1 minuto atrás
const future = new Date(Date.now() + 60_000).toISOString(); // 1 minuto adelante
const now = new Date().toISOString(); // aprox. ahora (puede ser border-line)

// ── isEventPast ────────────────────────────────────────────────────────────

test("isEventPast: evento cuyo endDate ya pasó → true", () => {
  assert.equal(isEventPast(past), true);
});

test("isEventPast: evento cuyo endDate es futuro → false", () => {
  assert.equal(isEventPast(future), false);
});

test("isEventPast: acepta Date además de string", () => {
  assert.equal(isEventPast(new Date(Date.now() - 1)), true);
  assert.equal(isEventPast(new Date(Date.now() + 60_000)), false);
});

// ── isSessionPast ──────────────────────────────────────────────────────────

test("isSessionPast: sesión con endDate pasado → true", () => {
  assert.equal(isSessionPast(past), true);
});

test("isSessionPast: sesión con endDate futuro → false", () => {
  assert.equal(isSessionPast(future), false);
});

// ── hasUpcomingSessions ────────────────────────────────────────────────────

test("hasUpcomingSessions: al menos una sesión futura → true", () => {
  const sessions = [{ endDate: past }, { endDate: future }, { endDate: past }];
  assert.equal(hasUpcomingSessions(sessions), true);
});

test("hasUpcomingSessions: todas las sesiones vencidas → false", () => {
  const sessions = [{ endDate: past }, { endDate: past }];
  assert.equal(hasUpcomingSessions(sessions), false);
});

test("hasUpcomingSessions: array vacío → false", () => {
  assert.equal(hasUpcomingSessions([]), false);
});

// ── isSessionInProgress ──────────────────────────────────────────────────────

test("isSessionInProgress: sesión que comenzó y aún no terminó → true", () => {
  const start = new Date(Date.now() - 30 * 60_000).toISOString(); // hace 30 min
  const end = new Date(Date.now() + 30 * 60_000).toISOString();   // en 30 min
  assert.equal(isSessionInProgress(start, end), true);
});

test("isSessionInProgress: sesión futura (no ha comenzado) → false", () => {
  const start = new Date(Date.now() + 60_000).toISOString();
  const end = new Date(Date.now() + 120_000).toISOString();
  assert.equal(isSessionInProgress(start, end), false);
});

test("isSessionInProgress: sesión ya finalizada → false", () => {
  assert.equal(isSessionInProgress(past, past), false);
});

// ── isMultiDateEventPast ───────────────────────────────────────────────────

test("isMultiDateEventPast: todas las sesiones vencidas → true", () => {
  const sessions = [{ endDate: past }, { endDate: past }, { endDate: past }];
  assert.equal(isMultiDateEventPast(sessions), true);
});

test("isMultiDateEventPast: al menos una sesión futura → false", () => {
  const sessions = [{ endDate: past }, { endDate: future }];
  assert.equal(isMultiDateEventPast(sessions), false);
});

test("isMultiDateEventPast: array vacío → false (sin datos suficientes)", () => {
  assert.equal(isMultiDateEventPast([]), false);
});

// ── Casos de negocio clave ─────────────────────────────────────────────────

test("Caso 5: evento activo hoy (endDate futuro) NO es vencido", () => {
  const endDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // +2 horas
  assert.equal(isEventPast(endDate), false);
});

test("Caso 6: evento que terminó hace 1 minuto SÍ es vencido", () => {
  const endDate = new Date(Date.now() - 60_000).toISOString();
  assert.equal(isEventPast(endDate), true);
});

test("Multi-date con sesiones mixtas: evento padre NO vencido", () => {
  const sessions = [
    { endDate: past },  // 10 agosto → vencida
    { endDate: future }, // 20 agosto → futura
  ];
  assert.equal(isMultiDateEventPast(sessions), false);
  assert.equal(hasUpcomingSessions(sessions), true);
});

test("Multi-date con todas vencidas: evento padre SÍ vencido", () => {
  const sessions = [
    { endDate: past },
    { endDate: past },
    { endDate: past },
  ];
  assert.equal(isMultiDateEventPast(sessions), true);
  assert.equal(hasUpcomingSessions(sessions), false);
});

test("Evento padre activo con sesión pasada y sesión futura", () => {
  const sessions = [
    { endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }, // 1 semana atrás
    { endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 días adelante
  ];
  assert.equal(isMultiDateEventPast(sessions), false);
  assert.equal(hasUpcomingSessions(sessions), true);
  assert.equal(isSessionPast(sessions[0].endDate), true);
  assert.equal(isSessionPast(sessions[1].endDate), false);
});
