import { test } from "node:test"
import assert from "node:assert/strict"
import { EventSessionService, SessionOverlapError } from "./EventSessionService"
import type { IEventSessionRepository } from "@/domain/repository/events/IEventSessionRepository"
import type { EventSession } from "@/domain/entities/events/EventSession"

/** Repo falso: `overlap` fija lo que responde hasOverlap (otra sesión ocupa ese horario). */
function service(overlap: boolean) {
  const created: unknown[] = []
  const updated: unknown[] = []
  const repo = {
    hasOverlap: async () => overlap,
    getByEventId: async () => [],
    create: async (d: unknown) => { created.push(d); return { id: "s2", ...(d as object) } as EventSession },
    update: async (_e: string, _s: string, d: unknown) => { updated.push(d); return { id: "s2", ...(d as object) } as EventSession },
  } as unknown as IEventSessionRepository
  return { svc: new EventSessionService(repo), created, updated }
}

const base = { eventId: "e1", title: "Borrador", startDate: new Date("2026-11-06T17:00:00Z"), endDate: new Date("2026-11-06T18:00:00Z") }

test("un BORRADOR nuevo no se bloquea aunque su horario provisional choque con otra sesión", async () => {
  const { svc, created } = service(true)
  await svc.createSession({ ...base, status: "draft" } as never)
  assert.equal(created.length, 1)
})

test("una sesión PUBLICADA nueva sí se bloquea si choca", async () => {
  const { svc, created } = service(true)
  await assert.rejects(() => svc.createSession({ ...base, status: "published" } as never), SessionOverlapError)
  assert.equal(created.length, 0)
})

test("actualizar un BORRADOR con fechas que chocan no se bloquea", async () => {
  const { svc, updated } = service(true)
  await svc.updateSession("e1", "s2", { ...base, status: "draft" } as never)
  assert.equal(updated.length, 1)
})

test("actualizar a PUBLICADA con fechas que chocan se bloquea", async () => {
  const { svc, updated } = service(true)
  await assert.rejects(() => svc.updateSession("e1", "s2", { ...base, status: "published" } as never), SessionOverlapError)
  assert.equal(updated.length, 0)
})

test("sin choque, publicar funciona", async () => {
  const { svc, created } = service(false)
  await svc.createSession({ ...base, status: "published" } as never)
  assert.equal(created.length, 1)
})
