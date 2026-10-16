/**
 * Siembra los festivos de Colombia (cálculo por regla, Ley Emiliani) en `appConfig/holidays-<año>`.
 * No pisa años que ya tienen configuración (los edita el administrador). DRY-RUN por defecto.
 * Uso: pnpm exec tsx scripts/seed-holidays.ts <añoDesde> [<añoHasta>] [--apply]
 * Sin sembrar, la app igual funciona (calcula por regla); sembrar solo sirve para poder editar un año en el panel.
 * La caché de la app (`config-holidays`) vence sola en ≤1 día; el panel la invalida al instante y este script también
 * si tiene REVALIDATE_APP_URL y SITE_REVALIDATE_WEBHOOK_SECRET en el entorno.
 */
import "./_loadEnv"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { ConfigFirebaseRepository } from "@/infraestructure/firebase/repositories/config/ConfigFirebaseRepository"
import { HolidayService } from "@/application/services/config/HolidayService"
import { computeColombiaHolidays } from "@/domain/entities/holidays/colombiaHolidays"
import { revalidateConfig } from "./_revalidateSite"

const args = process.argv.slice(2)
const APPLY = args.includes("--apply")
const [from, to = from] = args.filter((a) => /^\d{4}$/.test(a)).map(Number)

async function main() {
  if (!from || to < from || to - from > 20) throw new Error("Uso: seed-holidays.ts <añoDesde> [<añoHasta>] [--apply] (máx. 20 años)")
  const svc = new HolidayService(new ConfigFirebaseRepository(getFirebaseFirestore()))
  for (let y = from; y <= to; y++) {
    const list = computeColombiaHolidays(y)
    console.log(`${y}: ${list.length} festivos → ${list.map((h) => h.date.slice(5)).join(" ")}`)
    if (APPLY) console.log(`   ${await svc.seedYear(y, "script:seed-holidays")}`)
  }
  if (APPLY) await revalidateConfig("holidays")
  else console.log("dry-run (usa --apply)")
}
main().catch((e) => { console.error(e); process.exit(1) })
