import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { ServerBoundary } from "@/presentation/shared/components/ServerBoundary";
import { loginAction } from "@/app/actions/auth/login.action";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton";

export default function Login({
    searchParams,
}: {
    searchParams: Promise<{ redirect_to?: string }>;
}) {
    return (
        <AuthPageShell
            title="Iniciar sesion"
            description="Ingresa tu correo y contrasena para continuar."
            bottomText="Aun no tienes cuenta?"
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

                        <GoogleAuthButton label="Iniciar sesion con Google" redirectTo={sp.redirect_to} />
                    </>
                )}
            </ServerBoundary>
        </AuthPageShell>
    );
}