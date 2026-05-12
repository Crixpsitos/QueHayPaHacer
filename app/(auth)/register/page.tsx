import { registerAction } from "@/app/actions/auth/register.action";
import { AuthPageShell } from "@/app/components/layout/auth/AuthPageShell";
import { RegisterForm } from "@/app/components/feature/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Crear cuenta"
      description="Completa tus datos para empezar a usar la plataforma."
      bottomText="Ya tienes una cuenta?"
      bottomHrefText="Iniciar sesion"
      bottomHref="/login"
    >
      <RegisterForm registerAction={registerAction} />
    </AuthPageShell>
  );
}
