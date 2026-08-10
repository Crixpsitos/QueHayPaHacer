import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!getApps().length) {
  const sa = JSON.parse(readFileSync(resolve("quehaypahacerAccountService.json"), "utf-8"));
  initializeApp({ credential: cert(sa) });
}

const db = getFirestore(getApps()[0], "quehaypahacer-db");

async function run() {
  const snap = await db.collection("categories").get();
  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const doc of snap.docs) {
    const slug = doc.data().slug as string | undefined;
    if (!slug || seen.has(slug)) {
      toDelete.push(doc.id);
    } else {
      seen.set(slug, doc.id);
    }
  }

  console.log(`Total: ${snap.size} | Duplicados/sin-slug a borrar: ${toDelete.length}`);
  for (const id of toDelete) {
    await db.collection("categories").doc(id).delete();
    console.log("  ✗ Borrado:", id);
  }
  console.log("Listo. Quedan:", snap.size - toDelete.length, "categorías.");
}

run().catch(console.error);
