import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Container } from "@/app/components/layout/shared/Container";
import { getMyPlansAction } from "@/app/actions/activities/my-plans.action";
import { FollowChannel } from "@/presentation/shared/components/FollowChannel";
import { MyPlans } from "@/presentation/activities/components/MyPlans";

export const metadata: Metadata = { title: "Mis planes" };

// Datos de la sesión (cookies) y de Firestore: dinámico, dentro de Suspense.
async function PlansContent() {
  const plans = await getMyPlansAction();
  if (!plans) redirect("/login?redirect_to=%2Fmis-planes");
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <MyPlans initial={plans} />
      <div className="flex flex-wrap gap-3">
        <Suspense fallback={null}><FollowChannel /></Suspense>
        <Link href="/avisos" className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">Elegir mis avisos</Link>
      </div>
    </div>
  );
}

export default function MisPlanesPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Suspense fallback={<div className="mx-auto h-96 w-full max-w-2xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <PlansContent />
      </Suspense>
    </Container>
  );
}
