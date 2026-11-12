/**
 * Retención de moderación (privacidad: «hasta 12 meses»). DRY-RUN por defecto; nada se borra sin --apply.
 * Borra: sanciones cuya vigencia terminó hace más de 12 meses, apelaciones ya resueltas hace más de 12 meses y
 * límites (`rateLimits`) vencidos. NO toca reseñas ni reportes abiertos.
 * Uso: pnpm exec tsx scripts/purge-moderation-records.ts [--apply]
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const APPLY = process.argv.includes("--apply");
const YEAR = 365 * 86_400_000;
const ms = (v: unknown): number => (v && typeof (v as { toMillis?: unknown }).toMillis === "function" ? (v as { toMillis: () => number }).toMillis() : v instanceof Date ? v.getTime() : 0);

async function main() {
  const db = getFirebaseFirestore();
  const cutoff = Date.now() - YEAR;
  const sanctions = (await db.collection("activitySanctions").limit(1000).get()).docs.filter((d) => ms(d.get("expiresAt")) < cutoff);
  const appeals = (await db.collection("activityAppeals").where("status", "in", ["restored", "rejected"]).limit(1000).get()).docs.filter((d) => ms(d.get("resolvedAt")) < cutoff);
  const limits = (await db.collection("rateLimits").where("expireAt", "<", new Date()).limit(500).get()).docs;
  console.log(`sanciones viejas: ${sanctions.length} · apelaciones resueltas viejas: ${appeals.length} · límites vencidos: ${limits.length}`);
  if (!APPLY) return console.log("(dry-run) agrega --apply para borrar.");
  for (const d of [...sanctions, ...appeals, ...limits]) await d.ref.delete();
  console.log("listo");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
