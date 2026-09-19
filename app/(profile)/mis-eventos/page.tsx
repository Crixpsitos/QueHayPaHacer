import { Container } from "@/app/components/layout/shared/Container";
import { MyEventsManager } from "@/presentation/profile/components/MyEventsManager";

export default function MyEventsPage() {
  return (
    <Container className="py-6 sm:py-8">
      <MyEventsManager />
    </Container>
  );
}