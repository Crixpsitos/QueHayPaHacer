import { registerAction } from "@/app/actions/auth/register.action";
import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { RegisterForm } from "@/app/components/feature/auth/RegisterForm";
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Crear cuenta"
      description="Únete para guardar tus planes y aportar eventos en Ibagué."
      bottomText="¿Ya tienes una cuenta?"
      bottomHrefText="Iniciar sesión"
      bottomHref="/login"
    >
      <div className="mb-5">
        <GoogleAuthButton label="Registrarse con Google" />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o regístrate con correo</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <RegisterForm registerAction={registerAction} />
    </AuthPageShell>
  );
}
