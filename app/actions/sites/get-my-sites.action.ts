"use server"

import { getTokens } from "next-firebase-auth-edge"
import { cookies } from "next/headers"
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import type { SiteDetail } from "@/presentation/sites/view-models/SiteFormViewModel"

export async function getMySitesAction(): Promise<SiteDetail[]> {
  const tokens = await getTokens(await cookies(), authConfig)
  if (!tokens?.decodedToken?.uid) return []

  const { sitesService } = createServerContainer()
  return sitesService.getMySites(tokens.decodedToken.uid)
}
