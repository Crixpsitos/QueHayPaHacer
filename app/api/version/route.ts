import { connection } from "next/server"

/**
 * Revisión de Cloud Run que atiende ahora (cambia en cada despliegue). La usa `NewVersionNotice` para avisar
 * a quien tiene la pestaña abierta con una versión anterior. `connection()` evita que se prerenderice en el build.
 */
export async function GET() {
  await connection()
  return Response.json({ revision: process.env.K_REVISION ?? null }, { headers: { "Cache-Control": "no-store" } })
}
