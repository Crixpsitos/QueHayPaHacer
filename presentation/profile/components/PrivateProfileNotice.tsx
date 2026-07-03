import { Lock } from "lucide-react";
import { MotionFadeIn } from "./MotionFadeIn";
import type { PublicProfileViewModel } from "../view-models/PublicProfileViewModel";

interface PrivateProfileNoticeProps {
  profile: PublicProfileViewModel;
}

export function PrivateProfileNotice({ profile }: PrivateProfileNoticeProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.username;
  const displayHandle = profile.isProfessional ? `@${profile.username}` : fullName;

  return (
    <MotionFadeIn delay={0.1}>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-brand-violet/15 to-brand-orange/10 ring-1 ring-border">
          <Lock className="h-8 w-8 text-foreground/70" strokeWidth={1.75} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Esta cuenta es privada</p>
          <p className="text-sm text-muted-foreground">
            Solo <span className="font-medium text-foreground/80">{displayHandle}</span> puede ver sus eventos, sitios e insignias.
          </p>
        </div>
      </div>
    </MotionFadeIn>
  );
}
