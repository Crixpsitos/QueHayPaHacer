import Image from "next/image";
import { cn } from "@/app/lib/utils/cn";

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  className?: string;
  initialsClassName?: string;
  textClassName?: string;
  loading?: "eager" | "lazy";
}

const getInitials = ({
  firstName,
  lastName,
  name,
}: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}) => {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

export const ProfileAvatar = ({
  src,
  alt,
  sizes = "96px",
  firstName,
  lastName,
  name,
  className,
  initialsClassName,
  textClassName,
  loading = "lazy",
}: ProfileAvatarProps) => {
  const initials = getInitials({ firstName, lastName, name });

  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} loading={loading} className="object-cover" />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-brand-violet/10",
            initialsClassName
          )}
        >
          <span className={cn("font-bold text-brand-violet", textClassName)}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};