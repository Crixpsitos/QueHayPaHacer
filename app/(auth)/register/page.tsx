import { registerAction } from "@/app/actions/auth/register.action";
import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { RegisterForm } from "@/app/components/feature/auth/RegisterForm";
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Crear cuenta"
      description="Completa tus datos para empezar a usar la plataforma."
      bottomText="Ya tienes una cuenta?"
      bottomHrefText="Iniciar sesion"
      bottomHref="/login"
    >
      <div className="mb-5">
        <GoogleAuthButton label="Registrarse con Google" />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o registrate con correo</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <RegisterForm registerAction={registerAction} />
    </AuthPageShell>
  );
}
