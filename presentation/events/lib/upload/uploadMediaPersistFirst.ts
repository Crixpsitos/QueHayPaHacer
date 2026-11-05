// El CF de optimización se dispara al terminar la subida y busca el item en Firestore: si el item se guarda DESPUÉS
// de subir, el CF llega antes y el medio queda "procesando" para siempre. Orden correcto: preparar → guardar → subir.
type Deps<F, P, I extends { id: string }> = {
  prepare: (file: F) => Promise<P>
  buildItem: (file: F, prepared: P) => Promise<I>
  /** Agrega los items al form (status "processing") y los guarda en Firestore. */
  persist: (items: I[]) => Promise<void>
  put: (file: F, prepared: P) => Promise<void>
  /** Marca esos items como "error" en el form y los guarda. */
  markError: (ids: string[]) => Promise<void>
}

export async function uploadMediaPersistFirst<F, P, I extends { id: string }>(
  files: F[],
  deps: Deps<F, P, I>,
): Promise<{ items: I[]; failedIds: string[] }> {
  const prepared = await Promise.all(files.map(deps.prepare))
  const items = await Promise.all(files.map((f, i) => deps.buildItem(f, prepared[i])))
  await deps.persist(items)

  const results = await Promise.allSettled(files.map((f, i) => deps.put(f, prepared[i])))
  const failedIds = items.filter((_, i) => results[i].status === "rejected").map((i) => i.id)
  if (failedIds.length) await deps.markError(failedIds)

  return { items, failedIds }
}
