import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { loginAction } from "@/app/actions/auth/login.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false, follow: false } };

export default function Login({
    searchParams,
}: {
    searchParams: Promise<{ redirect_to?: string }>;
}) {
    return (
        <AuthPageShell
            title="Iniciar sesión"
            description="Ingresa tu correo y contraseña para continuar."
            bottomText="¿Aún no tienes cuenta?"
            bottomHrefText="Crear cuenta"
            bottomHref="/register"
        >
            <ServerBoundary searchParams={searchParams}>
                {({ searchParams: sp }) => (
                    <>
                        <LoginForm loginAction={loginAction} redirectTo={sp.redirect_to} />

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">o</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <GoogleAuthButton label="Iniciar sesión con Google" redirectTo={sp.redirect_to} />
                    </>
                )}
            </ServerBoundary>
        </AuthPageShell>
    );
}