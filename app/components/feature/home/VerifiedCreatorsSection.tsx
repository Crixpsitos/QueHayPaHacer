import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Section } from "@/app/components/layout/shared/Section";
import { createServerContainer } from "@/infraestructure/di/container";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";

async function getVerifiedCreators() {
  "use cache";
  cacheLife("hours");
  cacheTag("verified-creators-v1");

  const { userService } = createServerContainer();
  return userService.getVerifiedCreators(10);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function VerifiedCreatorsSection() {
  const creators = await getVerifiedCreators();

  if (creators.length === 0) return null;

  return (
    <Section spacing="sm" className="pb-12 sm:pb-16">
      <div className="border-y border-border py-8 sm:py-10">
        <div className="mb-7 max-w-2xl">
          <p className="text-xs font-semibold uppercase text-primary">Comunidad QHPA</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            Conoce a nuestros creadores verificados
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Personas y proyectos que crean experiencias para disfrutar la ciudad.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 lg:grid-cols-10">
          {creators.map((creator) => {
            const displayName = `${creator.firstName} ${creator.lastName}`.trim() || creator.displayName;

            return (
              <Link
                key={creator.uid}
                href={buildProfileHref({ id: creator.uid, displayName: creator.displayName })}
                className="group flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <span className="relative">
                  <Avatar className="size-18 border-2 border-background shadow-md ring-2 ring-border transition-transform group-hover:scale-105 sm:size-20">
                    {creator.photoURL ? <AvatarImage src={creator.photoURL} alt={displayName} /> : null}
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary-dark">
                      {initials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-background bg-primary text-white">
                    <BadgeCheck className="size-3.5" aria-hidden />
                  </span>
                </span>
                <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
                  {displayName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}