import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import { CHANNEL_CONFIG_KEY, parseChannelUrl } from "@/domain/entities/links/channelLink"

/** Enlace del Canal de WhatsApp desde `appConfig/whatsapp-channel`. null si no está puesto o no es válido (el botón no se dibuja). */
export const fetchChannelUrl = async (): Promise<string | null> => {
  "use cache"
  cacheLife("hours")
  cacheTag("app-config")
  const doc = await createServerContainer().appConfigRepo.get<{ url?: string }>(CHANNEL_CONFIG_KEY).catch(() => null)
  return parseChannelUrl(doc?.data.url)
}
