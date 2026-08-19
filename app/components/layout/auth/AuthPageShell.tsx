import Link from "next/link";
import { BackButton } from "@/app/components/ui/navigation/BackButton";

interface AuthPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  bottomText: string;
  bottomHrefText: string;
  bottomHref: string;
}

export function AuthPageShell({
  title,
  description,
  children,
  bottomText,
  bottomHrefText,
  bottomHref,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-secondary bg-card p-8 shadow-card">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {bottomText}{" "}
          <Link href={bottomHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
            {bottomHrefText}
          </Link>
        </p>
      </section>
    </main>
  );
}
