import { Container } from "@/app/components/layout/shared/Container";
import { MyRegistrationsSkeleton } from "@/presentation/profile/components/my-registrations/MyRegistrationsSkeleton";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-12">
      <MyRegistrationsSkeleton />
    </Container>
  );
}
