import { SettingsCenter } from "@/presentation/profile/components/SettingsCenter";
import { Suspense } from "react";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SettingsCenter hideTrigger />
      </Suspense>
      {children}
    </>
  );
}
