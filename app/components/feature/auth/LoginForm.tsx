"use client";

import { useState, useTransition } from "react";

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
  error?: string;
}

interface LoginFormProps {
  loginAction: (email: string, password: string) => Promise<LoginActionResult | void>;
}

export const LoginForm = ({ loginAction }: LoginFormProps) => {
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
      console.log("Login action result:", result);
      if (result?.error) {
        setSubmitError(result.error);
      }
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
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className={cn(
          "rounded-md bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity",
          (!isValid || isPending) && "cursor-not-allowed opacity-50",
        )}
      >
        {isPending ? "Ingresando..." : "Iniciar sesion"}
      </button>
    </form>
  );
};
