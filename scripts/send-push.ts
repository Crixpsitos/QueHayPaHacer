/**
 * Push manual a cuentas concretas (por correo). En seco por defecto; `--apply` envía de verdad.
 *
 *   npx tsx scripts/send-push.ts --body="Texto" [--title="Título"] [--href=/eventos] correo1 correo2 [--apply]
 *   npx tsx scripts/send-push.ts --find=angie        (busca cuentas por correo o nombre)
 *
 * El proyecto sale de FIREBASE_SERVICE_ACCOUNT_JSON (develop si no se pasa otra clave).
 * Envío directo: no gasta el tope diario ni mira el interruptor de avisos de la cuenta.
 */
import "./_loadEnv"
import { getMessaging } from "firebase-admin/messaging"

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const APPLY = process.argv.includes("--apply")
const EMAILS = process.argv.slice(2).filter((a) => !a.startsWith("--") && a.includes("@"))
const FIND = arg("find")?.toLowerCase()
const href = arg("href") ?? "/"
const payload = { title: arg("title") ?? "Qué Hay Pa Hacer", body: arg("body") ?? "", href: href.startsWith("/") ? href : "/" }

async function main() {
  if (!FIND && (!payload.body || !EMAILS.length)) throw new Error('Uso: --body="Texto" correo1 [correo2…] [--apply]  |  --find=nombre')
  const { getAdminApp, getFirebaseAdminAuth, getFirebaseFirestore } = await import("../infraestructure/firebase/config/admin/firebase")
  console.log("proyecto:", JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!).project_id, APPLY ? "(ENVÍO REAL)" : "(en seco)")
  const auth = getFirebaseAdminAuth()
  const db = getFirebaseFirestore()

  if (FIND) {
    let page: string | undefined
    do {
      const r = await auth.listUsers(1000, page)
      for (const u of r.users) if (`${u.email} ${u.displayName}`.toLowerCase().includes(FIND)) console.log("coincide:", u.email, "|", u.displayName)
      page = r.pageToken
    } while (page)
  }

  if (EMAILS.length) console.log("mensaje:", payload)
  for (const email of EMAILS) {
    const u = await auth.getUserByEmail(email).catch(() => null)
    if (!u) { console.log(email, "→ NO existe la cuenta"); continue }
    const tokens = (await db.collection("users").doc(u.uid).collection("pushTokens").limit(20).get()).docs.map((d) => d.get("token") as string)
    console.log(email, "→ dispositivos:", tokens.length)
    if (!APPLY) continue
    for (const token of tokens) {
      try {
        await getMessaging(getAdminApp()).send({ token, data: payload, webpush: { headers: { TTL: "86400", Urgency: "normal" } } })
        console.log("  enviado ✔")
      } catch (e) {
        console.log("  falló:", (e as { code?: string }).code ?? (e as Error).message)
      }
    }
  }
}
main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
