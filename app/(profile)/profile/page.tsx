import type { Metadata } from "next";
import { Container } from "@/app/components/layout/shared/Container";
import { ProfileHeader } from "@/presentation/profile/components";
import { ProfileTimeline } from "@/presentation/profile/components/ProfileTimeline";
import { getCachedProfileStats, getCachedUserBadges } from "@/presentation/profile/lib/cachedProfileData";
import { PendingInvitationsBanner } from "@/presentation/profile/components/invitations/PendingInvitationsBanner";
import { getSessionUid } from "@/app/actions/_session";

// Server Actions = endpoints públicos: el uid sale de la sesión, nunca del argumento del cliente.
const fetchStats = async () => {
    "use server";
    const uid = await getSessionUid();
    if (!uid) throw new Error("No autenticado");
    return getCachedProfileStats(uid);
};

const fetchUserBadges = async () => {
    "use server";
    const uid = await getSessionUid();
    if (!uid) throw new Error("No autenticado");
    return getCachedUserBadges(uid);
};

export const metadata: Metadata = { title: "Mi perfil" };

export default function ProfilePage() {
    return (
        <Container aria-label="Profile page" className="flex flex-col gap-6 py-6 sm:py-8">
            <PendingInvitationsBanner />
            <ProfileHeader statsPromise={fetchStats} badgesPromise={fetchUserBadges} />
            <ProfileTimeline />
        </Container>
    );
}
