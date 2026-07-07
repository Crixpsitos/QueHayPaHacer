import { existsSync } from "node:fs";

/**
 * Carga `.env` y `.env.local` en `process.env`. Se importa PRIMERO en los
 * scripts para que las variables existan antes de que se importe la config de
 * Firebase (que hace `JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)` en tiempo de
 * import). `tsx` no carga `.env` por sí solo.
 */
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
