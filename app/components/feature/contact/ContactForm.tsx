"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { useAuth } from "@/app/store/auth/AuthContext";
import { EmailInput } from "@/app/components/ui/inputs/EmailInput";
import { TextInput } from "@/app/components/ui/inputs/TextInput";
import { sendContactAction } from "@/app/actions/contact/send-contact.action";
import { useState } from "react";

const contactSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("El correo es obligatorio"),
    v.email("Ingresa un correo válido"),
  ),
  phoneNumber: v.pipe(
    v.string(),
    v.nonEmpty("El teléfono es obligatorio"),
    v.minLength(7, "Ingresa un número de teléfono válido"),
  ),
  message: v.pipe(
    v.string(),
    v.nonEmpty("El mensaje es obligatorio"),
    v.minLength(10, "El mensaje debe tener al menos 10 caracteres"),
    v.maxLength(500, "El mensaje no puede superar los 500 caracteres"),
  ),
});

type ContactFormValues = v.InferInput<typeof contactSchema>;

export function ContactForm() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ContactFormValues>({
    resolver: valibotResolver(contactSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      phoneNumber: "",
      message: "",
    },
  });

  useEffect(() => {
    if (user?.email) setValue("email", user.email, { shouldValidate: true });
    if (user?.profile?.phoneNumber)
      setValue("phoneNumber", user.profile.phoneNumber, { shouldValidate: true });
  }, [user, setValue]);

  const messageValue = watch("message") ?? "";

  const onSubmit = handleSubmit((data) => {
    setSubmitError(null);

    startTransition(async () => {
      const result = await sendContactAction(data);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      setSuccess(true);
      reset();
    });
  });

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <svg
          className="h-12 w-12 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-green-700">
          ¡Mensaje enviado!
        </h3>
        <p className="text-sm text-green-600">
          Hemos recibido tu mensaje. Nos comunicaremos contigo pronto.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-2 rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 transition-colors hover:bg-green-100"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <EmailInput<ContactFormValues>
          id="email"
          name="email"
          label="Correo electrónico"
          register={register}
          error={errors.email}
        />

        <TextInput<ContactFormValues>
          id="phoneNumber"
          name="phoneNumber"
          label="Número de teléfono"
          type="tel"
          register={register}
          error={errors.phoneNumber}
        />
      </div>

      <div>
        <div className="relative">
          <textarea
            {...register("message")}
            id="message"
            rows={5}
            aria-describedby={errors.message ? "message_help" : undefined}
            aria-invalid={Boolean(errors.message)}
            placeholder=" "
            className={`peer block w-full resize-none appearance-none rounded-md border bg-transparent px-2.5 pb-2.5 pt-5 text-sm text-foreground outline-none transition-colors focus:ring-0 ${
              errors.message
                ? "border-red-500 focus:border-red-500"
                : "border-zinc-300 focus:border-foreground"
            }`}
          />
          <label
            htmlFor="message"
            className={`absolute inset-s-1 top-2 z-10 origin-left -translate-y-4 scale-75 bg-background px-2 text-sm duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 ${
              errors.message
                ? "text-red-500 peer-focus:text-red-500"
                : "text-zinc-500 peer-focus:text-foreground"
            }`}
          >
            Déjanos un mensaje o motivo de contacto
          </label>
        </div>
        <div className="mt-1 flex items-start justify-between gap-2">
          {errors.message ? (
            <p
              id="message_help"
              role="alert"
              className="text-xs text-red-500"
            >
              <span className="font-medium">{errors.message.message}</span>
            </p>
          ) : (
            <span />
          )}
          <span
            className={`shrink-0 text-xs tabular-nums ${
              messageValue.length > 450 ? "text-red-500" : "text-zinc-400"
            }`}
          >
            {messageValue.length}/500
          </span>
        </div>
      </div>

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
        className="relative flex w-full items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Enviando…
          </>
        ) : (
          "Enviar mensaje"
        )}
      </button>
    </form>
  );
}
