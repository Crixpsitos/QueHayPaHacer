"use client";

import { useTransition, useState } from "react";
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { googleAuthAction } from "@/app/actions/auth/google-auth.action";
import { cn } from "@/app/lib/utils/cn";

interface GoogleAuthButtonProps {
  label?: string;
}

export const GoogleAuthButton = ({ label = "Continuar con Google" }: GoogleAuthButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        const provider = new GoogleAuthProvider();
        const credentials = await signInWithPopup(auth, provider);
        const idToken = await credentials.user.getIdToken();

        const result = await googleAuthAction(idToken, {
          uid: credentials.user.uid,
          email: credentials.user.email!,
          displayName:
            credentials.user.displayName ||
            credentials.user.email!.split("@")[0],
          photoURL: credentials.user.photoURL ?? undefined,
        });

        if (result?.error) {
          setError(result.error);
        }
      } catch (err) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? String((err as { code: string }).code)
            : "";
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
          setError("No fue posible iniciar sesion con Google. Intenta nuevamente.");
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
          isPending
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800",
        )}
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {isPending ? "Conectando..." : label}
      </button>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
);
