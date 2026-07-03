import { SupportView } from "@/presentation/studio/components/support/SupportView";
import { MOCK_SUPPORT_TICKETS } from "@/presentation/studio/lib/studioSupportMock";

export default function StudioSupportPage() {
  // MOCK por ahora. Cuando implementes el repositorio:
  //   const { studioService } = createServerContainer();
  //   const tickets = await studioService.getSupportTickets(uid);
  return <SupportView tickets={MOCK_SUPPORT_TICKETS} />;
}
