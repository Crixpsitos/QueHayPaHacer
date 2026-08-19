"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { EmailInput } from "@/app/components/ui/inputs/EmailInput";
import { PasswordInput } from "@/app/components/ui/inputs/PasswordInput";
import { cn } from "@/app/lib/utils/cn";

const loginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("El correo es obligatorio"),
    v.email("Ingresa un correo valido"),
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty("La contrasena es obligatoria"),
    v.minLength(6, "La contrasena debe tener al menos 6 caracteres"),
  ),
});

type LoginFormValues = v.InferInput<typeof loginSchema>;

interface LoginActionResult {
  success?: boolean;
  error?: string;
}

interface LoginFormProps {
  loginAction: (email: string, password: string) => Promise<LoginActionResult | void>;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  redirectTo?: string;
}

export const LoginForm = ({ loginAction, onSuccess, onError, redirectTo }: LoginFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: valibotResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    setSubmitError(null);

    startTransition(async () => {
      const result = await loginAction(data.email, data.password);
      if (result?.error) {
        setSubmitError(result.error);
        onError?.(result.error);
        return;
      }

      onSuccess?.();
      router.push(safeRedirect(redirectTo));
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-5">
      <EmailInput<LoginFormValues>
        id="email"
        name="email"
        label="Correo electronico"
        register={register}
        error={errors.email}
      />

      <PasswordInput<LoginFormValues>
        id="password"
        name="password"
        label="Contrasena"
        register={register}
        error={errors.password}
      />

      {submitError && (
        <p
          role="alert"
          className="rounded-xl border border-primary/20 bg-primary-light px-3 py-2 text-sm text-primary"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className={cn(
          "w-full rounded-full bg-gradient-to-br from-[#E63946] to-[#9B0A26] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary-glow)] transition-all",
          (!isValid || isPending)
            ? "cursor-not-allowed opacity-50"
            : "hover:from-[#FF4D5A] hover:to-[#B30E30]",
        )}
      >
        {isPending ? "Ingresando..." : "Iniciar sesion"}
      </button>
    </form>
  );
};

function safeRedirect(to?: string): string {
  if (!to || !to.startsWith("/") || to.startsWith("//")) return "/";
  return to;
}
