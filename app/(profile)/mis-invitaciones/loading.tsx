import { Container } from "@/app/components/layout/shared/Container";
import { MyInvitationsSkeleton } from "@/presentation/profile/components/invitations/MyInvitationsSkeleton";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-12">
      <MyInvitationsSkeleton />
    </Container>
  );
}
