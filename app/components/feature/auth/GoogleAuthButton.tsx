"use client";

import { safeRedirect } from "@/app/lib/utils/safeRedirect";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { googleAuthAction } from "@/app/actions/auth/google-auth.action";
import { cn } from "@/app/lib/utils/cn";

interface GoogleAuthButtonProps {
  label?: string;
  redirectTo?: string;
}

export const GoogleAuthButton = ({ label = "Continuar con Google", redirectTo }: GoogleAuthButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [needsTerms, setNeedsTerms] = useState(false);
  const [terms, setTerms] = useState(false);
  const [data, setData] = useState(false);

  const closeDialog = async () => {
    // La sesión de Firebase se abrió con el popup: se cierra para no dejar una cuenta a medias.
    setNeedsTerms(false);
    setTerms(false);
    setData(false);
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Sin sesión que cerrar.
    }
  };

  const authenticate = (accepted?: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        // Con aceptación se reutiliza la sesión abierta por el popup (no hay segundo popup).
        const credentials = accepted && auth.currentUser
          ? { user: auth.currentUser }
          : await signInWithPopup(auth, new GoogleAuthProvider());
        const idToken = await credentials.user.getIdToken();

        const result = await googleAuthAction(idToken, {
          uid: credentials.user.uid,
          email: credentials.user.email!,
          displayName:
            credentials.user.displayName ||
            credentials.user.email!.split("@")[0],
          photoURL: credentials.user.photoURL ?? undefined,
        }, accepted);

        if (result?.needsTerms) {
          setNeedsTerms(true);
          return;
        }
        if (result?.error) {
          setError(result.error);
          return;
        }
        setNeedsTerms(false);
        router.push(safeRedirect(redirectTo));
      } catch (err) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? String((err as { code: string }).code)
            : "";
        if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
          setError("No fue posible iniciar sesión con Google. Intenta nuevamente.");
        }
      }
    });
  };

  const handleClick = () => authenticate();

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={needsTerms} onOpenChange={(open) => { if (!open && !isPending) void closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Antes de crear tu cuenta</DialogTitle>
            <DialogDescription>
              Es la primera vez que usas esta cuenta de Google en Qué hay pa&apos; hacer. Para crearla necesitamos tu aceptación expresa.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary" />
              <span>
                Acepto los{" "}
                <Link href="/terminos" target="_blank" className="font-medium text-primary hover:underline">términos y condiciones</Link>
                {" "}y declaro que soy mayor de 18 años.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={data} onChange={(e) => setData(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary" />
              <span>
                Autorizo el tratamiento de mis datos personales según la{" "}
                <Link href="/privacidad" target="_blank" className="font-medium text-primary hover:underline">política de privacidad</Link>
                , incluida su transmisión a Google (Firebase) en Estados Unidos y su uso para prevenir y gestionar
                incumplimientos de la ley y atender requerimientos de autoridades y reclamos de terceros.
              </span>
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => void closeDialog()}
              disabled={isPending}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => authenticate(true)}
              disabled={!terms || !data || isPending}
              className={cn(
                "rounded-full bg-[#E63946] px-5 py-2.5 text-sm font-semibold text-white transition-all",
                !terms || !data || isPending ? "cursor-not-allowed opacity-50" : "hover:bg-[#9B0A26]",
              )}
            >
              {isPending ? "Creando cuenta..." : "Aceptar y continuar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors",
          isPending
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-secondary",
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
        <p role="alert" className="rounded-xl bg-primary-light px-3 py-2 text-sm text-primary">
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
