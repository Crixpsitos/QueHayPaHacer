import { loginAction } from "@/app/actions/auth/login.action";
import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { LoginForm } from "@/app/components/feature/auth/LoginForm";

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
        </AuthPageShell>
    );
}