import { Container } from "@/app/components/layout/shared/Container";
import { ProfileHeader } from "@/presentation/profile/components";
import { ProfileTabsWrapper } from "@/presentation/profile/components/ProfileTabsWrapper";
import { getCachedProfileStats, getCachedUserBadges } from "@/presentation/profile/lib/cachedProfileData";

const fetchStats = async (uid: string) => {
    "use server";
    return getCachedProfileStats(uid);
};

const fetchUserBadges = async (uid: string) => {
    "use server";
    return getCachedUserBadges(uid);
};

export default function ProfilePage() {
    return (
        <Container aria-label="Profile page" className="flex flex-col gap-6 py-6 sm:py-8">
            <ProfileHeader statsPromise={fetchStats} badgesPromise={fetchUserBadges} />
            <ProfileTabsWrapper />
        </Container>
    );
}
