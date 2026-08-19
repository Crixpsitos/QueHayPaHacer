"use client";

import { useState, useTransition } from "react";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import * as v from "valibot";

import { EmailInput } from "@/app/components/ui/inputs/EmailInput";
import { PasswordInput } from "@/app/components/ui/inputs/PasswordInput";
import { TextInput } from "@/app/components/ui/inputs/TextInput";
import { cn } from "@/app/lib/utils/cn";

const registerSchema = v.pipe(
  v.object({
    name: v.pipe(
      v.string(),
      v.nonEmpty("El nombre es obligatorio"),
    ),
    lastName: v.pipe(
      v.string(),
      v.nonEmpty("El apellido es obligatorio"),
    ),
    email: v.pipe(
      v.string(),
      v.nonEmpty("El correo es obligatorio"),
      v.email("Ingresa un correo valido"),
    ),
    phoneNumber: v.pipe(
      v.string(),
      v.nonEmpty("El numero de telefono es obligatorio"),
      v.regex(/^\d{7,10}$/, "Solo digitos, sin prefijo +57"),
    ),
    password: v.pipe(
      v.string(),
      v.nonEmpty("La contrasena es obligatoria"),
      v.minLength(6, "La contrasena debe tener al menos 6 caracteres"),
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.nonEmpty("Confirma tu contrasena"),
    ),
    acceptPersonalData: v.literal(true, "Debes aceptar el uso de datos personales"),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (input) => input.password === input.confirmPassword,
      "Las contrasenas no coinciden",
    ),
    ["confirmPassword"],
  ),
);

type RegisterFormValues = v.InferInput<typeof registerSchema>;

interface RegisterActionResult {
  error?: string;
}

interface RegisterFormProps {
  registerAction: (
    name: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string,
  ) => Promise<RegisterActionResult | void>;
}

export const RegisterForm = ({ registerAction }: RegisterFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: valibotResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      acceptPersonalData: undefined,
    },
  });

  const onSubmit = handleSubmit((data) => {
    setSubmitError(null);

    startTransition(async () => {
      const result = await registerAction(
        data.name,
        data.lastName,
        data.email,
        data.phoneNumber,
        data.password,
      );
      if (result?.error) {
        setSubmitError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <TextInput<RegisterFormValues>
          id="name"
          name="name"
          label="Nombre"
          register={register}
          error={errors.name}
        />

        <TextInput<RegisterFormValues>
          id="lastName"
          name="lastName"
          label="Apellido"
          register={register}
          error={errors.lastName}
        />
      </div>

      <EmailInput<RegisterFormValues>
        id="email"
        name="email"
        label="Correo electronico"
        register={register}
        error={errors.email}
      />

      <TextInput<RegisterFormValues>
        id="phoneNumber"
        name="phoneNumber"
        label="Numero de telefono"
        type="tel"
        register={register}
        error={errors.phoneNumber}
      />

      <PasswordInput<RegisterFormValues>
        id="password"
        name="password"
        label="Contrasena"
        register={register}
        error={errors.password}
      />

      <PasswordInput<RegisterFormValues>
        id="confirmPassword"
        name="confirmPassword"
        label="Repetir contrasena"
        register={register}
        error={errors.confirmPassword}
      />

      <div className="flex flex-col gap-1">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
          <input
            {...register("acceptPersonalData")}
            type="checkbox"
            id="acceptPersonalData"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          />
          <span>
            Acepto el uso de mis datos personales conforme a la politica de privacidad.
          </span>
        </label>
        {errors.acceptPersonalData && (
          <p role="alert" className="text-xs text-primary">
            <span className="font-medium">{errors.acceptPersonalData.message}</span>
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="rounded-xl border border-primary/20 bg-primary-light px-3 py-2 text-sm text-primary">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className={cn(
          "w-full rounded-full bg-gradient-to-br from-[#E63946] to-[#9B0A26] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-primary-glow)] transition-all",
          !isValid || isPending
            ? "cursor-not-allowed opacity-50"
            : "hover:from-[#FF4D5A] hover:to-[#B30E30]",
        )}
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
};
