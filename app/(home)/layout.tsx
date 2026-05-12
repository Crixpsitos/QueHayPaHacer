import { HomeLayout } from "@/app/components/layout/home/HomeLayout";

export default function HomeRouteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <HomeLayout>{children}</HomeLayout>
}
