/**
 * Contador de lecturas de Firestore por colección y operación, para saber QUÉ datos cuestan lecturas.
 * Apagado por defecto: se enciende con `FIRESTORE_READ_COUNTER=1`. Escribe una línea JSON (`message: "firestore-reads"`)
 * cada ~60 s por instancia; en Cloud Logging se suma con `jsonPayload.message="firestore-reads"`.
 * Cuenta documentos devueltos (mínimo 1 por consulta, como cobra Firestore). No cubre pipelines ni agregaciones (`count()`).
 * ponytail: por colección y no por ruta: las funciones con "use cache" corren fuera del contexto de la petición, no hay forma fiable de atribuir ruta.
 */
export class ReadCounter {
  private byKey = new Map<string, { calls: number; docs: number }>()
  private since = Date.now()
  constructor(private readonly windowMs = 60_000, private readonly emit: (line: object) => void = (l) => console.log(JSON.stringify(l))) {}

  record(collection: string, op: string, docs: number, now = Date.now()) {
    const key = `${collection}.${op}`
    const e = this.byKey.get(key) ?? { calls: 0, docs: 0 }
    e.calls += 1
    e.docs += Math.max(1, docs)
    this.byKey.set(key, e)
    if (now - this.since >= this.windowMs) this.flush(now)
  }

  flush(now = Date.now()) {
    if (!this.byKey.size) { this.since = now; return }
    const items = Object.fromEntries([...this.byKey].sort((a, b) => b[1].docs - a[1].docs))
    const total = [...this.byKey.values()].reduce((s, e) => s + e.docs, 0)
    this.emit({ severity: "INFO", message: "firestore-reads", windowSec: Math.round((now - this.since) / 1000), total, items })
    this.byKey.clear()
    this.since = now
  }
}

type AnyProto = Record<string, unknown>
const colOfPath = (p: unknown) => String(p ?? "").split("/")[0] || "?"

/** Envuelve `Query.get`, `DocumentReference.get` y `Firestore.getAll` de la instancia dada. Idempotente. */
export function installReadCounter(db: unknown, counter = new ReadCounter()): ReadCounter {
  const d = db as { collection: (p: string) => object; doc: (p: string) => object }
  const wrap = (proto: AnyProto, method: string, after: (self: unknown, args: unknown[], res: unknown) => void) => {
    if (proto[`__qhpaRC_${method}`]) return
    const orig = proto[method] as (...a: unknown[]) => Promise<unknown>
    proto[method] = async function (this: unknown, ...args: unknown[]) {
      const res = await orig.apply(this, args)
      try { after(this, args, res) } catch { /* contar nunca rompe una lectura */ }
      return res
    }
    proto[`__qhpaRC_${method}`] = true
  }
  const query = Object.getPrototypeOf(Object.getPrototypeOf(d.collection("_"))) as AnyProto
  const docRef = Object.getPrototypeOf(d.doc("_/_")) as AnyProto
  const firestore = Object.getPrototypeOf(db) as AnyProto
  wrap(query, "get", (self, _a, res) => counter.record(String((self as { _queryOptions?: { collectionId?: string } })._queryOptions?.collectionId ?? "query"), "query", (res as { size?: number }).size ?? 0))
  wrap(docRef, "get", (self) => counter.record(colOfPath((self as { path?: string }).path), "doc", 1))
  wrap(firestore, "getAll", (_s, args) => {
    for (const r of args as { path?: string }[]) if (r && typeof r === "object" && "path" in r) counter.record(colOfPath(r.path), "getAll", 1)
  })
  const t = setInterval(() => counter.flush(), 60_000)
  ;(t as { unref?: () => void }).unref?.()
  return counter
}
