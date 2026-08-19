import { SettingsCenter } from "@/presentation/profile/components/SettingsCenter";
import { ProfileLayoutHeader } from "@/app/components/layout/profile/ProfileLayoutHeader";

export default function EventDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ProfileLayoutHeader />
      {/* SettingsCenter solo monta el Drawer; el trigger vive en ProfileLayoutHeader */}
      <SettingsCenter hideTrigger />
      <main>{children}</main>
    </div>
  );
}
