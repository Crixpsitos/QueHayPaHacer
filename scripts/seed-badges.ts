/**
 * Crea el catálogo base de insignias en `badges/{id}`. Idempotente: omite las existentes.
 * Reemplaza al antiguo `GET /api/admin/seed-badges` (público, sin auth).
 *
 * Uso:
 *   pnpm exec tsx scripts/seed-badges.ts           # dry-run
 *   pnpm exec tsx scripts/seed-badges.ts --apply   # escribe
 */
import "./_loadEnv"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import type { Badge } from "@/domain/entities/user/Badge"

const APPLY = process.argv.includes("--apply")
const BADGES_TO_SEED: Record<string, Badge> = {
  "new-user": {
    id: "new-user",
    name: "Usuario Nuevo",
    description: "Bienvenido a la comunidad QueHayPaHacer",
    icon: "⭐",
    color: "#FFD700",
    category: "system",
    criteria: {
      type: "automatic",
      requirement: "Se otorga automáticamente al crear una cuenta",
    },
    createdAt: new Date(),
    active: true,
  },
  "first-event": {
    id: "first-event",
    name: "Primer Evento",
    description: "Creaste tu primer evento",
    icon: "🎉",
    color: "#FF6B6B",
    category: "achievement",
    criteria: {
      type: "automatic",
      requirement: "Se otorga al crear el primer evento",
    },
    createdAt: new Date(),
    active: true,
  },
  "community-builder": {
    id: "community-builder",
    name: "Construtor de Comunidad",
    description: "Has creado 10 eventos",
    icon: "🏗️",
    color: "#4ECDC4",
    category: "achievement",
    criteria: {
      type: "automatic",
      requirement: "Se otorga al crear 10 eventos",
    },
    createdAt: new Date(),
    active: true,
  },
  "year-member": {
    id: "year-member",
    name: "Miembro de Un Año",
    description: "Llevas 1 año en la comunidad",
    icon: "🎂",
    color: "#A78BFA",
    category: "milestone",
    criteria: {
      type: "automatic",
      requirement: "Se otorga después de 1 año en la plataforma",
    },
    createdAt: new Date(),
    active: true,
  },
}

async function main() {
  const db = getFirebaseFirestore()
  for (const [badgeId, badgeData] of Object.entries(BADGES_TO_SEED)) {
    const badgeRef = db.collection("badges").doc(badgeId)
    if ((await badgeRef.get()).exists) {
      console.log(`= ${badgeId} ya existe`)
    } else if (APPLY) {
      await badgeRef.set(badgeData)
      console.log(`+ ${badgeId} creada`)
    } else {
      console.log(`+ ${badgeId} se crearía (dry-run, usa --apply)`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
