// Caché en el navegador (IndexedDB) para pintar al instante lo último visto mientras se pide lo fresco.
// Cada entrada guarda el uid de quien la creó: otra sesión no la lee, y al cerrar sesión se borra todo.
// Todo es asíncrono; cualquier fallo (IndexedDB bloqueado, modo privado, lleno) equivale a "sin caché".

const PREFIX = "v1:";
const DB_NAME = "qhpa-cache";
const STORE = "kv";

type Entry<T> = { uid: string | null; at: number; data: T };

export interface CacheBackend {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export function createClientCache(backend: CacheBackend) {
  const safe = async <R>(fn: () => Promise<R>, fallback: R): Promise<R> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  /** Lee `key` si es de `uid` y no pasó de `maxAgeMs`. */
  async function readCache<T>(key: string, uid: string | null, maxAgeMs: number, now = Date.now()): Promise<{ data: T; at: number } | null> {
    const e = (await safe(() => backend.get(PREFIX + key), undefined)) as Entry<T> | undefined;
    if (!e || typeof e !== "object" || e.uid !== uid || now - e.at > maxAgeMs) return null;
    return { data: e.data, at: e.at };
  }

  async function writeCache<T>(key: string, uid: string | null, data: T, now = Date.now()): Promise<void> {
    await safe(() => backend.set(PREFIX + key, { uid, at: now, data } satisfies Entry<T>), undefined);
  }

  async function removeCache(key: string): Promise<void> {
    await safe(() => backend.delete(PREFIX + key), undefined);
  }

  /** Borra todo lo guardado por la app (cerrar sesión: no dejar datos de la persona en el equipo). */
  async function clearClientCache(): Promise<void> {
    const keys = await safe(() => backend.keys(), [] as string[]);
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX)).map((k) => safe(() => backend.delete(k), undefined)));
  }

  // Lectura-modificación-escritura en orden por clave: dos actualizaciones seguidas no se pisan.
  const queues = new Map<string, Promise<unknown>>();
  function updateCache<T>(key: string, uid: string | null, maxAgeMs: number, update: (prev: T | undefined) => T): Promise<void> {
    const run = async () => {
      const prev = (await readCache<T>(key, uid, maxAgeMs))?.data;
      await writeCache(key, uid, update(prev));
    };
    const next = (queues.get(key) ?? Promise.resolve()).then(run, run);
    queues.set(key, next);
    return next.then(() => undefined, () => undefined);
  }

  /** Tras cambiar datos propios (eventos, sitios, perfil, inscripciones): la próxima apertura pide lo fresco sin pintar lo viejo. */
  async function invalidateMyData(): Promise<void> {
    await Promise.all(MY_DATA_KEYS.map(removeCache));
  }

  return { readCache, writeCache, removeCache, clearClientCache, updateCache, invalidateMyData };
}

/** Claves que dependen de datos propios y se invalidan al mutarlos (ver invalidateMyData). */
export const MY_DATA_KEYS = ["my-profile", "my-events", "preference-events"] as const;

// --- Respaldo IndexedDB -------------------------------------------------------------------------------------

const idbRequest = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

let dbPromise: Promise<IDBDatabase> | null = null;
const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => (dbPromise = null));
  return dbPromise;
};
const store = async (mode: IDBTransactionMode) => (await openDb()).transaction(STORE, mode).objectStore(STORE);

const idbBackend: CacheBackend = {
  get: async (key) => idbRequest((await store("readonly")).get(key)),
  set: async (key, value) => void (await idbRequest((await store("readwrite")).put(value, key))),
  delete: async (key) => void (await idbRequest((await store("readwrite")).delete(key))),
  keys: async () => (await idbRequest((await store("readonly")).getAllKeys())).map(String),
};

export const { readCache, writeCache, removeCache, clearClientCache, updateCache, invalidateMyData } = createClientCache(idbBackend);
