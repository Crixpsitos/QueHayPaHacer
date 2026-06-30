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
        <Container aria-label="Profile page" className="flex h-full flex-col justify-center gap-6 p-4">
            <div className="space-y-6">
                <ProfileHeader statsPromise={fetchStats} badgesPromise={fetchUserBadges} />
            </div>
            <ProfileTabsWrapper />
        </Container>
    );
}
