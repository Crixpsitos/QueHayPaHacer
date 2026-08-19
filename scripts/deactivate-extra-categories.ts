import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!getApps().length) {
  const sa = JSON.parse(readFileSync(resolve("quehaypahacerAccountService.json"), "utf-8"));
  initializeApp({ credential: cert(sa) });
}

const db = getFirestore(getApps()[0], "quehaypahacer-db");
const KEEP = new Set(["music", "art", "food", "sports", "education", "tech", "health", "family", "party", "nature"]);

async function run() {
  const snap = await db.collection("categories").get();
  let deactivated = 0;
  for (const doc of snap.docs) {
    const slug = doc.data().slug as string | undefined;
    if (!slug || !KEEP.has(slug)) {
      await doc.ref.update({ isActive: false });
      console.log("  ✗ desactivada:", slug ?? "(sin slug)");
      deactivated++;
    }
  }
  console.log("\nDesactivadas:", deactivated, "| Activas:", KEEP.size);
}

run().catch(console.error);
