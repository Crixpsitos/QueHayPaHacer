import type { Metadata } from "next";
import { Container } from "@/app/components/layout/shared/Container";
import { MyEventsManager } from "@/presentation/profile/components/MyEventsManager";

export const metadata: Metadata = { title: "Mis eventos" };

export default function MyEventsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <MyEventsManager />
    </Container>
  );
}