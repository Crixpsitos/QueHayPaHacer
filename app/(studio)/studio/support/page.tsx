import type { Metadata } from "next";
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session";
import { createServerContainer } from "@/infraestructure/di/container";
import { SupportView } from "@/presentation/studio/components/support/SupportView";
import type { SupportTicketVM } from "@/presentation/studio/view-models/StudioSupportViewModel";

export const metadata: Metadata = { title: "Soporte" };

export default async function StudioSupportPage() {
  await redirectLimitedToEvents();

  // Premium verificado aquí también: el layout (StudioGate) no protege requests RSC directas.
  const uid = await getPremiumSessionUid();
  if (!uid) {
    return <SupportView uid="" tickets={[]} />;
  }
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
