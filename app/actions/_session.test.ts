import { test } from "node:test"
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

// Las Server Actions son POST públicos. Toda action que reciba un uid/userId
// del cliente debe verificarlo contra la sesión (getTokens/_session).
// ponytail: chequeo estático por regex; reemplazar por tests de integración con sesión real cuando haya E2E.
const GUARD = /getTokens|getSessionUid|getPremiumSessionUid|requireEventPermission|getEventAccess|isStudioEventOwner|isStudioSiteOwner|verifyIdToken/
const TAKES_UID = /\b(uid|userId|currentUid)\b/
const PUBLIC_UID_OK = new Set([
  // Solo consulta disponibilidad; no escribe ni expone datos del uid.
  "app/actions/profile/check-username-availability.action.ts",
  // El uid lo obtiene el servidor al crear la credencial, no lo envía el cliente.
  "app/actions/auth/register.action.ts",
])

test("server actions que reciben uid verifican la sesión", () => {
  const files = execSync(`git ls-files --cached --others --exclude-standard app presentation`, { encoding: "utf8" })
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts") && existsSync(f))
  const offenders = files.filter((f) => {
    const src = readFileSync(f, "utf8")
    return /^["']use server["']/.test(src) && TAKES_UID.test(src) && !GUARD.test(src) && !PUBLIC_UID_OK.has(f)
  })
  assert.deepEqual(offenders, [])
})
