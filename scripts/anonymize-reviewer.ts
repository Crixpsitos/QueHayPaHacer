/**
 * Ops: derecho de supresión (Ley 1581). DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/anonymize-reviewer.ts <uid>                    # lista lo que cambiaría
 *      pnpm exec tsx scripts/anonymize-reviewer.ts <uid> --apply            # reseñas quedan como «Usuario eliminado», sin foto de perfil
 *      pnpm exec tsx scripts/anonymize-reviewer.ts <uid> --delete --apply   # borra las reseñas, ajusta el promedio y borra sus fotos/videos
 * Al eliminar la cuenta desde la app ya se borran las reseñas; este script es para solicitudes por correo.
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { StorageService } from "@/infraestructure/storage/firebase/FirebaseStorageService";
import { ActivityReviewFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityReviewFirebaseRepository";

const args = process.argv.slice(2);
const uid = args.find((a) => !a.startsWith("--"));
const APPLY = args.includes("--apply");
const DELETE = args.includes("--delete");

async function main() {
  if (!uid) throw new Error("Falta el uid: anonymize-reviewer.ts <uid> [--delete] [--apply]");
  const repo = new ActivityReviewFirebaseRepository(getFirebaseFirestore());
  const mine = await repo.listByAuthorSince(uid, new Date(0));
  console.log(`${mine.length} reseñas de ${uid}:`);
  for (const r of mine) console.log(`  ${r.id}  ${"★".repeat(r.rating)}  ${r.status}  medios=${r.media.length}`);
  if (!APPLY) return console.log(`(dry-run) ${DELETE ? "se borrarían" : "se anonimizarían"}. Agrega --apply para escribir.`);
  const storage = new StorageService();
  for (const r of mine) {
    if (DELETE) {
      const res = await repo.remove(r.activityId, uid, { force: true });
      for (const m of res.media) for (const p of [m.path, m.thumbnailPath]) if (p) await storage.delete(p).catch(() => undefined);
    } else {
      await getFirebaseFirestore().collection("activityReviews").doc(r.id).update({ "author.displayName": "Usuario eliminado", "author.photoURL": "", updatedAt: new Date() });
    }
  }
  console.log("listo");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
