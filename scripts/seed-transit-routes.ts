/**
 * Siembra el catálogo de rutas de bus de Ibagué en `appConfig/transit-routes`.
 * Solo contiene rutas respaldadas por una fuente pública (comentada en cada una); es una lista de números/nombres,
 * SIN trazado ni horarios. Una persona de Ibagué debe revisarla antes de usarla. No pisa un catálogo existente
 * (se edita con las acciones de administración). DRY-RUN por defecto.
 * Uso: pnpm exec tsx scripts/seed-transit-routes.ts [--apply]
 * La caché `config-transit` vence sola en ≤1 día; con REVALIDATE_APP_URL y SITE_REVALIDATE_WEBHOOK_SECRET se invalida al instante.
 */
import "./_loadEnv"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { ConfigFirebaseRepository } from "@/infraestructure/firebase/repositories/config/ConfigFirebaseRepository"
import { TransitRouteService, parseTransitRoutes } from "@/application/services/config/TransitRouteService"
import { revalidateConfig } from "./_revalidateSite"

const APPLY = process.argv.includes("--apply")

// Fuentes:
//  [A] Alcaldía de Ibagué, resolución 000152: https://www.ibague.gov.co/portal/seccion/noticias/index.php?idnt=16864
//  [B] Integra Actualidad, "14 rutas de buseta cambiarán en Ibagué": https://integraactualidad.com/14-rutas-de-buseta-cambiaran-en-ibague-conozca-cuales-son/
//  [E] Expreso Ibagué: https://expresoibague.com/rutas/
const ROUTES = [
  { id: "1", label: "Ruta 1" },   // [B] [E]
  { id: "2", label: "Ruta 2" },   // [B] [E]
  { id: "4-7", label: "Ruta 4/7" }, // [A] "4/7"; [E] "Ruta Cuatro Siete"
  { id: "5", label: "Ruta 5" },   // [E]
  { id: "6", label: "Ruta 6" },   // [A] [E]
  { id: "7", label: "Ruta 7" },   // [B]
  { id: "8", label: "Ruta 8" },   // [A] [B]
  { id: "9", label: "Ruta 9" },   // [B]
  { id: "11", label: "Ruta 11" }, // [A]
  { id: "15", label: "Ruta 15" }, // [B]
  { id: "17", label: "Ruta 17" }, // [A]
  { id: "19", label: "Ruta 19" }, // [B]
  { id: "21", label: "Ruta 21" }, // [B]
  { id: "28", label: "Ruta 28" }, // [B]
  { id: "29", label: "Ruta 29" }, // [B]
  { id: "37", label: "Ruta 37" }, // [B]
  { id: "40", label: "Ruta 40" }, // [B]
  { id: "48", label: "Ruta 48" }, // [B]
  { id: "50", label: "Ruta 50" }, // [B]
]

async function main() {
  const parsed = parseTransitRoutes(ROUTES)
  if (!parsed.ok) throw new Error(parsed.error)
  console.log(`${parsed.routes.length} rutas: ${parsed.routes.map((r) => r.label).join(", ")}`)
  if (!APPLY) return console.log("dry-run (usa --apply)")
  const svc = new TransitRouteService(new ConfigFirebaseRepository(getFirebaseFirestore()))
  console.log(await svc.seed(parsed.routes, "script:seed-transit-routes"))
  await revalidateConfig("transit")
}
main().catch((e) => { console.error(e); process.exit(1) })
