import { test } from "node:test"
import assert from "node:assert/strict"
import { uploadMediaPersistFirst } from "./uploadMediaPersistFirst"

type Item = { id: string; path: string }

// Registra el orden real de las llamadas para probar "persistir ANTES de subir".
function setup(opts: { failPut?: string[] } = {}) {
  const log: string[] = []
  const deps = {
    prepare: async (f: string) => { log.push(`prepare:${f}`); return { path: `p/${f}` } },
    buildItem: async (f: string, prep: { path: string }): Promise<Item> => ({ id: `id-${f}`, path: prep.path }),
    persist: async (items: Item[]) => { log.push(`persist:${items.map((i) => i.id).join(",")}`) },
    put: async (f: string) => {
      log.push(`put:${f}`)
      if (opts.failPut?.includes(f)) throw new Error("boom")
    },
    markError: async (ids: string[]) => { log.push(`error:${ids.join(",")}`) },
  }
  return { log, deps }
}

test("el item se guarda en Firestore antes de que empiece cualquier subida", async () => {
  const { log, deps } = setup()
  await uploadMediaPersistFirst(["a", "b"], deps)
  const firstPut = log.findIndex((l) => l.startsWith("put:"))
  const persist = log.findIndex((l) => l.startsWith("persist:"))
  assert.ok(persist !== -1 && firstPut !== -1 && persist < firstPut, log.join(" | "))
})

test("prepara todos los archivos antes de guardar", async () => {
  const { log, deps } = setup()
  await uploadMediaPersistFirst(["a", "b"], deps)
  assert.deepEqual(log.slice(0, 3), ["prepare:a", "prepare:b", "persist:id-a,id-b"])
})

test("si una subida falla, ese item se marca error y las demás siguen", async () => {
  const { log, deps } = setup({ failPut: ["b"] })
  const res = await uploadMediaPersistFirst(["a", "b", "c"], deps)
  assert.deepEqual(res.failedIds, ["id-b"])
  assert.ok(log.includes("put:a") && log.includes("put:c"))
  assert.ok(log.includes("error:id-b"))
})

test("si todas suben bien no marca error ni persiste dos veces", async () => {
  const { log, deps } = setup()
  const res = await uploadMediaPersistFirst(["a"], deps)
  assert.deepEqual(res.failedIds, [])
  assert.equal(log.filter((l) => l.startsWith("error:") || l.startsWith("persist:")).length, 1)
})

test("devuelve los items creados", async () => {
  const { deps } = setup()
  const res = await uploadMediaPersistFirst(["a", "b"], deps)
  assert.deepEqual(res.items.map((i) => i.id), ["id-a", "id-b"])
})
