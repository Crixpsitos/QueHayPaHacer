import Image from "next/image";
import { cn } from "@/app/lib/utils/cn";
import { getInitials } from "@/app/lib/utils/getInitials";

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
  const initials = getInitials(name, { firstName, lastName }) || "?";

  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} loading={loading} className="object-cover" />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-primary/10",
            initialsClassName
          )}
        >
          <span className={cn("font-bold text-primary", textClassName)}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};