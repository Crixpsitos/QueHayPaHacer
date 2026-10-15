/**
 * Ops: reclamos de sitios (colección siteClaims). DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/list-site-claims.ts
 *      pnpm exec tsx scripts/list-site-claims.ts --approve <claimId> [--apply]
 *      pnpm exec tsx scripts/list-site-claims.ts --reject <claimId> --reason "..." [--apply]
 *
 * Aprobar = en UNA transacción: reclamo approved; sitio verification "verified", publishedAs "owner" y
 * author = perfil del reclamante (se guarda el author anterior en el reclamo para revertir); los demás
 * reclamos pendientes del sitio pasan a rejected ("Otro reclamo aprobado").
 * LIMITACIÓN: el script no puede llamar updateTag/revalidateTag (solo existen dentro de Next). Ver
 * docs/16-sitios-confianza-y-reclamos.md, sección "Cachés".
 */
import "./_loadEnv";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const REVIEWER = "script:list-site-claims";
const db = getFirebaseFirestore();

async function approve(claimId: string) {
  const claimRef = db.collection("siteClaims").doc(claimId);
  await db.runTransaction(async (tx) => {
    const claimSnap = await tx.get(claimRef);
    if (!claimSnap.exists) throw new Error(`No existe el reclamo ${claimId}`);
    const claim = claimSnap.data()!;
    if (claim.status !== "pending") throw new Error(`El reclamo ya está ${claim.status}`);

    const siteRef = db.collection("sites").doc(claim.siteId);
    const [siteSnap, userSnap, othersSnap] = await Promise.all([
      tx.get(siteRef),
      tx.get(db.collection("users").doc(claim.claimantUid)),
      tx.get(db.collection("siteClaims").where("siteId", "==", claim.siteId).where("status", "==", "pending")),
    ]);
    if (!siteSnap.exists) throw new Error(`No existe el sitio ${claim.siteId}`);
    const site = siteSnap.data()!;

    const author: Record<string, string> = {
      id: claim.claimantUid,
      displayName: userSnap.get("displayName") || claim.claimantName,
    };
    const photoURL = userSnap.get("photoURL");
    if (photoURL) author.photoURL = photoURL;

    const previous = {
      author: site.author ?? null,
      verification: site.verification ?? null,
      publishedAs: site.publishedAs ?? null,
    };
    console.log(`Sitio "${site.name}" (${siteRef.id})`);
    console.log(`  author: ${previous.author?.displayName ?? "?"} (${previous.author?.id ?? previous.author?.uid ?? "?"}) -> ${author.displayName} (${author.id})`);
    console.log(`  verification: ${previous.verification} -> verified | publishedAs: ${previous.publishedAs} -> owner`);
    const others = othersSnap.docs.filter((d) => d.id !== claimId);
    console.log(`  reclamos que se rechazan: ${others.map((d) => d.id).join(", ") || "ninguno"}`);
    if (!APPLY) return console.log("dry-run (usa --apply)");

    tx.update(siteRef, { verification: "verified", publishedAs: "owner", author, updatedAt: FieldValue.serverTimestamp() });
    tx.update(claimRef, {
      status: "approved",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: REVIEWER,
      previousSite: previous,
    });
    for (const d of others) {
      tx.update(d.ref, {
        status: "rejected",
        rejectionReason: "Otro reclamo aprobado",
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: REVIEWER,
      });
    }
    console.log("ok: approved. Cachés: ver docs (se refrescan por TTL).");
  });
}

async function reject(claimId: string, reason?: string) {
  if (!reason?.trim()) throw new Error('Uso: --reject <claimId> --reason "..." [--apply]');
  const ref = db.collection("siteClaims").doc(claimId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`No existe el reclamo ${claimId}`);
  if (snap.get("status") !== "pending") throw new Error(`El reclamo ya está ${snap.get("status")}`);
  console.log({ id: claimId, siteName: snap.get("siteName"), claimantName: snap.get("claimantName"), reason });
  if (!APPLY) return console.log("dry-run (usa --apply)");
  await ref.update({
    status: "rejected",
    rejectionReason: reason.trim(),
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: REVIEWER,
  });
  console.log("ok: rejected");
}

async function list() {
  // ponytail: filtra y ordena en memoria (evita índice compuesto); paginar si los pendientes crecen a miles.
  const snap = await db.collection("siteClaims").where("status", "==", "pending").get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as FirebaseFirestore.DocumentData)
    .sort((a, b) => (a.createdAt as Timestamp)?.toMillis() - (b.createdAt as Timestamp)?.toMillis());
  console.log(`${docs.length} reclamos pendientes\n`);
  for (const c of docs) {
    const site = await db.collection("sites").doc(c.siteId).get();
    const author = site.get("author");
    console.log(`id=${c.id}  ${(c.createdAt as Timestamp)?.toDate().toISOString() ?? "?"}`);
    console.log(`  sitio: "${c.siteName}" (${c.siteId}) kind=${site.get("kind") ?? "-"} verification=${site.get("verification") ?? "-"} autor actual=${author?.displayName ?? "?"} (${author?.id ?? author?.uid ?? "?"})`);
    console.log(`  reclamante: ${c.claimantName} <${c.contactEmail}> uid=${c.claimantUid} tel=${c.contactPhone ?? "-"} relación=${c.relation}`);
    console.log(`  evidencia: ${c.evidence}\n`);
  }
}

async function main() {
  const approveId = flag("--approve");
  const rejectId = flag("--reject");
  if (args.includes("--approve")) {
    if (!approveId) throw new Error("Uso: --approve <claimId> [--apply]");
    return approve(approveId);
  }
  if (args.includes("--reject")) {
    if (!rejectId) throw new Error('Uso: --reject <claimId> --reason "..." [--apply]');
    return reject(rejectId, flag("--reason"));
  }
  return list();
}
main().catch((e) => { console.error(e); process.exit(1); });
