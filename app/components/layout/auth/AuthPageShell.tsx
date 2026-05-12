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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
          {bottomText}{" "}
          <Link href={bottomHref} className="font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
            {bottomHrefText}
          </Link>
        </p>
      </section>
    </main>
  );
}
