"use server"

import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import type { Badge } from "@/domain/entities/user/Badge"

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

export async function seedBadgesAction(): Promise<{
  success: boolean
  message: string
  created: string[]
  skipped: string[]
}> {
  try {
    const db = getFirebaseFirestore()
    const result = {
      created: [] as string[],
      skipped: [] as string[],
    }

    for (const [badgeId, badgeData] of Object.entries(BADGES_TO_SEED)) {
      const badgeRef = db.collection("badges").doc(badgeId)
      const doc = await badgeRef.get()

      if (doc.exists) {
        result.skipped.push(badgeId)
        console.log(`✓ Insignia ${badgeId} ya existe`)
      } else {
        await badgeRef.set(badgeData)
        result.created.push(badgeId)
        console.log(`✓ Insignia ${badgeId} creada`)
      }
    }

    const message = `Seed completado. Creadas: ${result.created.length}, Existentes: ${result.skipped.length}`
    console.log(message)

    return {
      success: true,
      message,
      created: result.created,
      skipped: result.skipped,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error al hacer seed de insignias:", errorMessage)
    throw new Error(`Error al hacer seed de insignias: ${errorMessage}`)
  }
}
