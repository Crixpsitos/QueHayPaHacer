/**
 * profile-header-test.ts
 *
 * CLI interactivo para poblar datos reales de un usuario en Firestore y
 * probar visualmente el ProfileHeader rediseñado en la app corriendo.
 *
 * Uso:
 *   npx tsx scripts/profile-header-test.ts
 *   npx tsx scripts/profile-header-test.ts <correo>
 *
 * Escenarios disponibles:
 *   1. 👤 Usuario normal        — elimina datos profesionales
 *   2. 🎪 Organizador natural   — persona natural con 4 redes
 *   3. 🏢 Organizador jurídico  — organización con NIT
 *   4. 🍺 Negocio               — bar con mapsLink
 *   5. 🏛  Gobierno              — alcaldía con datos institucionales
 *   6. ↩  Restaurar backup      — revierte al estado original
 *   7. ✖  Salir
 *
 * Seguridad:
 *   - Muestra el project_id de Firebase antes de cualquier operación.
 *   - Requiere escribir "PROBAR" para confirmar cambios en producción.
 *   - Crea backup en .tmp/profile-header-backup-<uid>.json antes de aplicar.
 *   - Opera sobre un único usuario a la vez.
 */

export {}; // módulo aislado

// ── 1. Cargar variables de entorno ANTES de importar Firebase ─────────────────
for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // archivo opcional
  }
}

// ── 2. Imports del runtime (no firebase) ─────────────────────────────────────
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ── 3. Helpers de string ──────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function generateUsername(name: string, maxLength = 30): string {
  return toSlug(name)
    .replace(/-/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, maxLength);
}

// ── 4. Tipos ──────────────────────────────────────────────────────────────────

type ProType = "organizer" | "business" | "government";

interface ClaimsUpdate {
  role: "professional" | "user";
  isProfessional: boolean;
  professionalType?: ProType;
}

interface ScenarioDef {
  id: number;
  label: string;
  description: string;
  claimsUpdate: ClaimsUpdate;
  firestorePatch: Record<string, unknown>;
  firestoreDelete: string[];
}

interface BackupData {
  uid: string;
  capturedAt: string;
  doc: Record<string, unknown>;
  claims: Record<string, unknown>;
}

// ── 5. Campos que el script puede modificar (para backup y diff) ──────────────

const BACKUP_FIELDS = [
  "displayName",
  "firstName",
  "lastName",
  "bio",
  "brandName",
  "professionalDescription",
  "professionalType",
  "professionalDetails",
  "professionalStatus",
  "accountType",
  "website",
  "mapsLink",
  "socialLinks",
  "isUsernameCustomized",
  "phoneNumber",
] as const;

// ── 6. Definición de escenarios ───────────────────────────────────────────────

function buildScenarios(): ScenarioDef[] {
  return [
    // ─── Escenario 1: usuario normal ─────────────────────────────────────────
    {
      id: 1,
      label: "👤 Usuario normal",
      description: "Elimina todos los datos profesionales → cuenta personal básica",
      claimsUpdate: { role: "user", isProfessional: false },
      firestorePatch: {
        accountType: "personal",
        professionalStatus: "none",
      },
      firestoreDelete: [
        "professionalType",
        "professionalDetails",
        "professionalDescription",
        "brandName",
        "website",
        "mapsLink",
        "socialLinks",
      ],
    },

    // ─── Escenario 2: organizador persona natural ─────────────────────────────
    {
      id: 2,
      label: "🎪 Organizador natural",
      description: "Persona natural — brandName + 4 redes sociales",
      claimsUpdate: { role: "professional", isProfessional: true, professionalType: "organizer" },
      firestorePatch: {
        accountType: "professional",
        professionalType: "organizer",
        professionalStatus: "approved",
        brandName: "Cristian Eventos",
        displayName: generateUsername("Cristian Eventos"),
        isUsernameCustomized: true,
        professionalDescription:
          "Organizamos eventos de música, entretenimiento y experiencias culturales para la comunidad del Tolima. Más de 5 años conectando artistas y audiencias.",
        professionalDetails: {
          organizerType: "natural_person",
          organizationName: null,
          nit: null,
          eventCategories: [],
        },
        website: "https://cristianeventos.example.com",
        mapsLink: "https://maps.google.com/?q=Ibague+Tolima+Colombia",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/cristian_eventos_test" },
          { platform: "facebook", url: "https://facebook.com/cristian.eventos.test" },
          { platform: "tiktok", url: "https://tiktok.com/@cristian_eventos_test" },
          { platform: "youtube", url: "https://youtube.com/@cristian_eventos_test" },
        ],
      },
      firestoreDelete: [],
    },

    // ─── Escenario 3: organizador jurídico ────────────────────────────────────
    {
      id: 3,
      label: "🏢 Organizador jurídico",
      description: "Persona jurídica — organización con NIT visible",
      claimsUpdate: { role: "professional", isProfessional: true, professionalType: "organizer" },
      firestorePatch: {
        accountType: "professional",
        professionalType: "organizer",
        professionalStatus: "approved",
        brandName: "Eventos Tolima",
        displayName: generateUsername("Eventos Tolima"),
        isUsernameCustomized: true,
        professionalDescription:
          "Organización dedicada a la producción de eventos culturales, musicales y empresariales en el departamento del Tolima desde 2018.",
        professionalDetails: {
          organizerType: "organization",
          organizationName: "Eventos Tolima SAS",
          nit: "900123456-7",
          eventCategories: [],
        },
        website: "https://eventostolima.example.com",
        mapsLink: "https://maps.google.com/?q=Ibague+Colombia",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/eventos_tolima_test" },
          { platform: "facebook", url: "https://facebook.com/eventostolima.test" },
          { platform: "tiktok", url: "https://tiktok.com/@eventos_tolima_test" },
          { platform: "youtube", url: "https://youtube.com/@eventos_tolima_test" },
        ],
      },
      firestoreDelete: [],
    },

    // ─── Escenario 4: negocio ─────────────────────────────────────────────────
    {
      id: 4,
      label: "🍺 Negocio (bar)",
      description: "Bar con mapsLink, categoría business, NIT, teléfono comercial y redes",
      claimsUpdate: { role: "professional", isProfessional: true, professionalType: "business" },
      firestorePatch: {
        accountType: "professional",
        professionalType: "business",
        professionalStatus: "approved",
        brandName: "Bar El Encuentro",
        displayName: generateUsername("Bar El Encuentro"),
        isUsernameCustomized: true,
        professionalDescription:
          "Bar, restaurante y espacio cultural con música en vivo todos los viernes. Gastronomía típica del Tolima y cócteles artesanales.",
        professionalDetails: {
          businessCategory: "bar",
          businessDescription: null,
          mapsLink: "https://maps.google.com/?q=Bar+El+Encuentro+Ibague",
          socialLink: null,
          nit: "900.123.456-7",
          locationLat: 4.4378,
          locationLng: -75.2012,
          businessPhone: "+57 310 000 0000",
        },
        website: "https://barelencuentro.example.com",
        mapsLink: "https://maps.google.com/?q=Bar+El+Encuentro+Ibague+Tolima",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/bar_encuentro_test" },
          { platform: "facebook", url: "https://facebook.com/barelencuentro.test" },
          { platform: "tiktok", url: "https://tiktok.com/@bar_encuentro_test" },
          { platform: "youtube", url: "https://youtube.com/@bar_encuentro_test" },
        ],
      },
      firestoreDelete: [],
    },

    // ─── Escenario 5: gobierno ────────────────────────────────────────────────
    {
      id: 5,
      label: "🏛  Gobierno (alcaldía)",
      description: "Entidad pública — datos institucionales completos",
      claimsUpdate: { role: "professional", isProfessional: true, professionalType: "government" },
      firestorePatch: {
        accountType: "professional",
        professionalType: "government",
        professionalStatus: "approved",
        brandName: "Alcaldía de Ibagué",
        displayName: generateUsername("Alcaldía de Ibagué"),
        isUsernameCustomized: true,
        professionalDescription:
          "Entidad encargada de promover, coordinar y desarrollar programas culturales, artísticos y patrimoniales para la comunidad de Ibagué, capital musical de Colombia.",
        professionalDetails: {
          entityName: "Alcaldía de Ibagué",
          department: "Secretaría de Cultura",
          institutionalEmail: "cultura@ibague-test.example.com",
          institutionalPhone: "+57 608 261 1182",
          mapsLink: "https://maps.google.com/?q=Alcaldia+Ibague+Tolima",
          nit: "890.700.757-1",
        },
        website: "https://alcaldiaibague.example.com",
        mapsLink: "https://maps.google.com/?q=Alcaldia+Ibague+Tolima+Colombia",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/alcaldia_ibague_test" },
          { platform: "facebook", url: "https://facebook.com/alcaldia.ibague.test" },
          { platform: "twitter", url: "https://x.com/alcaldia_ibague_test" },
          { platform: "youtube", url: "https://youtube.com/@alcaldia_ibague_test" },
        ],
      },
      firestoreDelete: [],
    },
  ];
}

// ── 7. Utilidades de backup ───────────────────────────────────────────────────

function getBackupPath(uid: string): string {
  return `.tmp/profile-header-backup-${uid}.json`;
}

function createBackup(uid: string, docData: Record<string, unknown>, claims: Record<string, unknown>): string {
  mkdirSync(".tmp", { recursive: true });
  const path = getBackupPath(uid);

  // Solo guarda backup si no existe aún (protege el estado original)
  if (existsSync(path)) {
    console.log(`  ℹ️  Backup ya existe: ${path}`);
    return path;
  }

  const captured: Record<string, unknown> = {};
  for (const field of BACKUP_FIELDS) {
    if (field in docData) captured[field] = docData[field];
  }

  const backup: BackupData = {
    uid,
    capturedAt: new Date().toISOString(),
    doc: captured,
    claims,
  };
  writeFileSync(path, JSON.stringify(backup, null, 2), "utf8");
  console.log(`  💾 Backup guardado: ${path}`);
  return path;
}

function readBackup(uid: string): BackupData | null {
  const path = getBackupPath(uid);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BackupData;
  } catch {
    return null;
  }
}

// ── 8. Diff visual ────────────────────────────────────────────────────────────

const SENTINEL_DELETE = Symbol("DELETE");

function formatVal(v: unknown): string {
  if (v === undefined || v === null) return "\x1b[90m(sin valor)\x1b[0m";
  if (v === SENTINEL_DELETE) return "\x1b[31mDELETE\x1b[0m";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  return String(v);
}

function showDiff(currentDoc: Record<string, unknown>, scenario: ScenarioDef): void {
  const patch = { ...scenario.firestorePatch };
  for (const key of scenario.firestoreDelete) {
    (patch as Record<string, unknown>)[key] = SENTINEL_DELETE;
  }

  const allKeys = Array.from(
    new Set([...Object.keys(patch)])
  );

  const changed = allKeys.filter((k) => {
    const before = currentDoc[k];
    const after = patch[k];
    return JSON.stringify(before) !== JSON.stringify(after) && after !== undefined;
  });

  if (changed.length === 0) {
    console.log("\n  \x1b[33mSin cambios detectados.\x1b[0m");
    return;
  }

  const col = 26;
  console.log("\n  \x1b[90m" + "─".repeat(76) + "\x1b[0m");
  console.log(
    `  ${"CAMPO".padEnd(col)} ${"ANTES".padEnd(30)} ${"DESPUÉS"}`
  );
  console.log("  \x1b[90m" + "─".repeat(76) + "\x1b[0m");

  for (const key of changed) {
    const before = formatVal(currentDoc[key]);
    const after = formatVal(patch[key]);
    console.log(`  ${key.padEnd(col)} ${before.padEnd(50)} \x1b[32m${after}\x1b[0m`);
  }
  console.log("  \x1b[90m" + "─".repeat(76) + "\x1b[0m\n");
}

// ── 9. Aplicar escenario ──────────────────────────────────────────────────────

async function applyScenario(
  db: FirebaseFirestore.Firestore,
  auth: import("firebase-admin/auth").Auth,
  uid: string,
  scenario: ScenarioDef,
): Promise<void> {
  const { Timestamp, FieldValue } = await import("firebase-admin/firestore");

  // Construir el objeto de update
  const updateData: Record<string, unknown> = {
    ...scenario.firestorePatch,
    updatedAt: Timestamp.now(),
  };
  for (const key of scenario.firestoreDelete) {
    updateData[key] = FieldValue.delete();
  }

  await db.collection("users").doc(uid).update(updateData as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>);

  // Custom claims: preservar los existentes y sobreescribir los relevantes
  const user = await auth.getUser(uid);
  const existingClaims = user.customClaims ?? {};
  const newClaims: Record<string, unknown> = {
    ...existingClaims,
    role: scenario.claimsUpdate.role,
    isProfessional: scenario.claimsUpdate.isProfessional,
  };
  if (scenario.claimsUpdate.professionalType) {
    newClaims.professionalType = scenario.claimsUpdate.professionalType;
  } else {
    delete newClaims.professionalType;
  }
  await auth.setCustomUserClaims(uid, newClaims);
}

// ── 10. Restaurar backup ──────────────────────────────────────────────────────

async function restoreBackup(
  db: FirebaseFirestore.Firestore,
  auth: import("firebase-admin/auth").Auth,
  uid: string,
): Promise<boolean> {
  const backup = readBackup(uid);
  if (!backup) {
    console.error("\n  \x1b[31m✖ No se encontró backup para este usuario.\x1b[0m\n");
    return false;
  }

  console.log(`\n  Backup capturado el: ${backup.capturedAt}`);
  console.log("  Campos a restaurar:", Object.keys(backup.doc).join(", "));

  const { Timestamp, FieldValue } = await import("firebase-admin/firestore");

  // Restaurar campos del doc
  const restoreData: Record<string, unknown> = {
    ...backup.doc,
    updatedAt: Timestamp.now(),
  };
  // Campos del backup no presentes = borrar del doc actual
  for (const field of BACKUP_FIELDS) {
    if (!(field in backup.doc)) {
      restoreData[field] = FieldValue.delete();
    }
  }

  await db.collection("users").doc(uid).update(restoreData as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>);

  // Restaurar claims
  await auth.setCustomUserClaims(uid, backup.claims as Record<string, unknown>);

  console.log("\n  \x1b[32m✔ Usuario restaurado al estado original.\x1b[0m");
  return true;
}

// ── 11. Mostrar estado actual del usuario ─────────────────────────────────────

function showCurrentUser(doc: Record<string, unknown>): void {
  console.log("\n  \x1b[36mEstado actual:\x1b[0m");
  const show = (label: string, value: unknown) => {
    const v = value == null ? "\x1b[90m(sin valor)\x1b[0m" : String(
      typeof value === "object" ? JSON.stringify(value).slice(0, 80) : value
    );
    console.log(`    ${label.padEnd(24)} ${v}`);
  };
  show("accountType", doc.accountType);
  show("displayName (@handle)", doc.displayName);
  show("firstName", doc.firstName);
  show("lastName", doc.lastName);
  show("brandName", doc.brandName);
  show("professionalType", doc.professionalType);
  show("professionalStatus", doc.professionalStatus);
  show("website", doc.website);
  show("socialLinks", Array.isArray(doc.socialLinks) ? `[${(doc.socialLinks as unknown[]).length} entradas]` : doc.socialLinks);
  console.log();
}

// ── 12. Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const rl = createInterface({ input, output });

  // Importar Firebase Admin (el env ya está cargado)
  const { getFirebaseFirestore, getFirebaseAdminAuth } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );

  const db = getFirebaseFirestore();
  const auth = getFirebaseAdminAuth();

  // ── Mostrar proyecto Firebase ──────────────────────────────────────────────
  let projectId = "(desconocido)";
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "{}");
    projectId = sa.project_id ?? projectId;
  } catch { /* silenciar */ }

  console.log("\n\x1b[1m╔═══════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m║      profile-header-test  —  TEST DE VISUAL        ║\x1b[0m");
  console.log("\x1b[1m╚═══════════════════════════════════════════════════╝\x1b[0m");
  console.log(`\n  🔥 Firebase project: \x1b[33m${projectId}\x1b[0m`);
  console.log("  ⚠️  Este script modifica datos REALES en Firestore y Firebase Auth.");
  console.log("  Escribe \"PROBAR\" para continuar, o Enter para cancelar.\n");

  const confirm = await rl.question("  Confirmar: ");
  if (confirm.trim() !== "PROBAR") {
    console.log("\n  Cancelado.\n");
    rl.close();
    return;
  }

  // ── Buscar usuario ─────────────────────────────────────────────────────────
  const emailArg = (process.argv[2] ?? "").trim();
  let email = emailArg;

  if (!email) {
    email = (await rl.question("\n  Email del usuario: ")).trim();
  }

  if (!email) {
    console.error("\n  \x1b[31m✖ Email requerido.\x1b[0m\n");
    rl.close();
    process.exit(1);
  }

  // Buscar en Firestore por email
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  if (snap.empty) {
    console.error(`\n  \x1b[31m✖ No se encontró ningún usuario con email: ${email}\x1b[0m\n`);
    rl.close();
    process.exit(1);
  }

  const userDoc = snap.docs[0];
  const uid = userDoc.id;
  const docData = { uid, ...userDoc.data() } as Record<string, unknown>;

  // Capturar claims actuales
  const fbUser = await auth.getUser(uid);
  const currentClaims = fbUser.customClaims ?? {};

  console.log(`\n  \x1b[32m✔ Usuario encontrado\x1b[0m`);
  console.log(`    uid:   ${uid}`);
  console.log(`    email: ${email}`);
  showCurrentUser(docData);

  const SCENARIOS = buildScenarios();

  // ── Loop de menú ──────────────────────────────────────────────────────────
  let running = true;
  while (running) {
    console.log("  \x1b[1mEscoge un escenario:\x1b[0m");
    for (const s of SCENARIOS) {
      console.log(`    \x1b[36m${s.id}\x1b[0m) ${s.label}`);
      console.log(`       \x1b[90m${s.description}\x1b[0m`);
    }
    console.log(`    \x1b[36m6\x1b[0m) ↩  Restaurar backup`);
    console.log(`    \x1b[36m7\x1b[0m) ✖  Salir\n`);

    const choice = (await rl.question("  Opción [1-7]: ")).trim();

    if (choice === "7" || choice === "") {
      console.log("\n  Hasta luego.\n");
      running = false;
      break;
    }

    if (choice === "6") {
      const backup = readBackup(uid);
      if (!backup) {
        console.log("\n  \x1b[33mNo hay backup guardado para este usuario.\x1b[0m");
        console.log("  Aplica primero cualquier escenario (se creará el backup automáticamente).\n");
        continue;
      }
      console.log(`\n  Backup de ${backup.capturedAt}`);
      const ok = (await rl.question("  ¿Restaurar? [s/N]: ")).trim().toLowerCase();
      if (ok === "s" || ok === "si" || ok === "sí" || ok === "y") {
        await restoreBackup(db, auth, uid);
        console.log("\n  ⚠️  Cierra e inicia sesión en la app para ver los cambios.\n");
      } else {
        console.log("  Cancelado.\n");
      }
      continue;
    }

    const scenarioNum = parseInt(choice, 10);
    const scenario = SCENARIOS.find((s) => s.id === scenarioNum);
    if (!scenario) {
      console.log("  \x1b[31mOpción inválida.\x1b[0m\n");
      continue;
    }

    // Mostrar diff
    console.log(`\n  \x1b[1m${scenario.label}\x1b[0m — \x1b[90m${scenario.description}\x1b[0m`);
    showDiff(docData, scenario);

    const apply = (await rl.question("  ¿Aplicar? [s/N]: ")).trim().toLowerCase();
    if (apply !== "s" && apply !== "si" && apply !== "sí" && apply !== "y") {
      console.log("  Cancelado.\n");
      continue;
    }

    // Crear backup antes de la primera modificación
    createBackup(uid, docData, currentClaims as Record<string, unknown>);

    // Aplicar
    console.log("  Aplicando...");
    await applyScenario(db, auth, uid, scenario);

    // Actualizar docData local para que el siguiente diff sea correcto
    for (const [k, v] of Object.entries(scenario.firestorePatch)) {
      docData[k] = v;
    }
    for (const k of scenario.firestoreDelete) {
      delete docData[k];
    }

    console.log(`\n  \x1b[32m✔ Escenario "${scenario.label}" aplicado.\x1b[0m`);
    console.log("  ⚠️  Cierra e inicia sesión en la app para que el token refleje los nuevos claims.");
    console.log(`  🌐 Perfil: /profile/${docData.displayName ?? "?"}\n`);
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("\n\x1b[31mError fatal:\x1b[0m", err);
    process.exit(1);
  });
