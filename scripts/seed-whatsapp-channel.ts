/**
 * Crea `appConfig/whatsapp-channel` con el campo `url` vacío para que lo llenes tú en la consola de Firebase
 * (o con --url). Sin enlace válido el botón «Seguir el canal» no se muestra. DRY-RUN por defecto.
 * Uso: pnpm exec tsx scripts/seed-whatsapp-channel.ts [--url https://whatsapp.com/channel/XXXX] [--apply]
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { CHANNEL_CONFIG_KEY, parseChannelUrl } from "@/domain/entities/links/channelLink";

const args = process.argv.slice(2);
const i = args.indexOf("--url");
const raw = i >= 0 ? args[i + 1] : "";
const APPLY = args.includes("--apply");

async function main() {
  const url = raw ? parseChannelUrl(raw) : "";
  if (raw && !url) throw new Error("El enlace no es de un canal de WhatsApp (https://whatsapp.com/channel/…).");
  const ref = getFirebaseFirestore().collection("appConfig").doc(CHANNEL_CONFIG_KEY);
  const cur = await ref.get();
  console.log(cur.exists ? `ya existe (url actual: ${cur.get("url") || "(vacía)"})` : "no existe todavía");
  if (cur.exists && !raw) return console.log("Nada que hacer. Edita `url` en la consola de Firebase cuando tengas el enlace.");
  console.log(`${APPLY ? "ESCRIBIENDO" : "(dry-run) escribiría"} url=${url || "(vacía)"}`);
  if (!APPLY) return;
  await ref.set({ url, updatedAt: new Date(), updatedBy: "script:seed-whatsapp-channel" }, { merge: true });
  console.log("listo");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
