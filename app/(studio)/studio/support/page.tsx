import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import { createServerContainer } from "@/infraestructure/di/container";
import { SupportView } from "@/presentation/studio/components/support/SupportView";
import type { SupportTicketVM } from "@/presentation/studio/view-models/StudioSupportViewModel";

export default async function StudioSupportPage() {
  const tokens = await getTokens(await cookies(), authConfig);
  if (!tokens) {
    return <SupportView uid="" tickets={[]} />;
  }

  const uid = tokens.decodedToken.uid;
  const { studioService } = createServerContainer();
  const tickets = await studioService.getSupportTickets(uid);

  const vm: SupportTicketVM[] = tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return <SupportView uid={uid} tickets={vm} />;
}
