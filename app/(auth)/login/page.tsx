import { loginAction } from "@/app/actions/auth/login.action";
import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton";

export default function Login() {
    return (
        <AuthPageShell
            title="Iniciar sesion"
            description="Ingresa tu correo y contrasena para continuar."
            bottomText="Aun no tienes cuenta?"
            bottomHrefText="Crear cuenta"
            bottomHref="/register"
        >
            <LoginForm loginAction={loginAction} />

            <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-xs text-zinc-400">o</span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>

            <GoogleAuthButton label="Iniciar sesion con Google" />
        </AuthPageShell>
    );
}