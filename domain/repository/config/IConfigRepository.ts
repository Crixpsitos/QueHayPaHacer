/** Documentos de configuración de la app (colección `appConfig`): un doc por clave, p. ej. `holidays-2026`. */
export interface ConfigDoc<T> {
  data: T
  updatedAt: number
  updatedBy: string | null
}

export interface IConfigRepository {
  get<T>(key: string): Promise<ConfigDoc<T> | null>
  /** Reemplaza el documento completo. */
  set<T>(key: string, data: T, updatedBy: string | null): Promise<void>
  delete(key: string): Promise<void>
}
