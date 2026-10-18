"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { sendContactAction } from "@/app/actions/contact/send-contact.action";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { EASE_OUT, SuccessCheck } from "@/app/components/motion/primitives";
import { cn } from "@/app/lib/utils/cn";

// ── Contact reasons ────────────────────────────────────────────────────────────

const CONTACT_REASON_VALUES = [
  "premium", "general_inquiry", "report_problem", "report_event", "report_site",
  "account_problem", "suggestion", "advertising_partnership", "other",
] as const;

type ContactReason = typeof CONTACT_REASON_VALUES[number];

const CONTACT_REASONS: { value: ContactReason; label: string }[] = [
  { value: "premium",                 label: "Quiero Premium" },
  { value: "general_inquiry",         label: "Consulta general" },
  { value: "report_problem",          label: "Reportar un problema" },
  { value: "report_event",            label: "Reportar un evento" },
  { value: "report_site",             label: "Reportar un sitio" },
  { value: "account_problem",         label: "Problema con mi cuenta" },
  { value: "suggestion",              label: "Propuesta o sugerencia" },
  { value: "advertising_partnership", label: "Publicidad o alianzas" },
  { value: "other",                   label: "Otro" },
];

// ── Validation schema ──────────────────────────────────────────────────────────

const contactSchema = v.object({
  contactReason: v.pipe(
    v.string("El motivo de contacto es obligatorio"),
    v.nonEmpty("El motivo de contacto es obligatorio"),
    v.picklist(CONTACT_REASON_VALUES, "Selecciona un motivo válido"),
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty("El correo es obligatorio"),
    v.email("Ingresa un correo válido"),
  ),
  phoneNumber: v.optional(v.pipe(v.string(), v.maxLength(20, "El teléfono es demasiado largo"))),
  message: v.pipe(
    v.string(),
    v.nonEmpty("El mensaje es obligatorio"),
    v.minLength(10, "El mensaje debe tener al menos 10 caracteres"),
    v.maxLength(1000, "El mensaje no puede superar los 1000 caracteres"),
  ),
});

type ContactFormValues = v.InferInput<typeof contactSchema>;

// ── Field wrapper ──────────────────────────────────────────────────────────────

function FieldWrapper({
  children, label, htmlFor, error, optional,
}: {
  children: React.ReactNode;
  label: string;
  htmlFor?: string;
  error?: { message?: string };
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-sm font-medium text-[#09090B]"
      >
        {label}
        {optional && (
          <span className="font-normal text-[#71717A]">(opcional)</span>
        )}
      </label>
      {children}
      <AnimatePresence>
        {error?.message && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-red-500"
          >
            <AlertCircle className="size-3 shrink-0" aria-hidden />
            {error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-[color,background-color,border-color,box-shadow,transform,opacity] bg-white focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-[#E4E4E7] focus:border-[#E63946] focus:ring-[#E63946]/10",
  );

const premiumMessage = (username?: string) =>
  `Hola, quiero activar Premium${username ? ` para @${username}` : ""}. Organizo: `;

// ── Main component ─────────────────────────────────────────────────────────────

export function ContactForm() {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register, handleSubmit, control, reset, setValue, watch,
    formState: { errors, isValid },
  } = useForm<ContactFormValues>({
    resolver: valibotResolver(contactSchema),
    mode: "onChange",
    defaultValues: { contactReason: "" as ContactReason, email: "", phoneNumber: "", message: "" },
  });

  // /contactanos?motivo=premium (CTAs de Premium) precarga el motivo.
  // Se lee en efecto (no useSearchParams) para que el formulario siga en el HTML estático.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("motivo") !== "premium") return;
    setValue("contactReason", "premium", { shouldValidate: true });
    setValue("message", premiumMessage(user?.profile?.username), { shouldValidate: true });
  }, [setValue, user?.profile?.username]);

  useEffect(() => {
    if (user?.email) setValue("email", user.email, { shouldValidate: true });
    if (user?.profile?.phoneNumber)
      setValue("phoneNumber", user.profile.phoneNumber, { shouldValidate: true });
  }, [user, setValue]);

  const messageValue = watch("message") ?? "";

  const onSubmit = handleSubmit((data) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await sendContactAction({
        contactReason: data.contactReason,
        email: data.email,
        phoneNumber: data.phoneNumber ?? "",
        message: data.message,
      });
      if (!result.success) {
        setSubmitError(result.error ?? "No se pudo enviar el mensaje. Intenta nuevamente.");
        return;
      }
      setSuccess(true);
      reset();
    });
  });

  if (success) {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center"
      >
        <SuccessCheck size={56} />
        <div>
          <h3
            className="text-lg font-bold text-emerald-800"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Mensaje enviado correctamente
          </h3>
          <p className="mt-1.5 text-sm text-emerald-700">
            Gracias por contactarnos. Te responderemos lo antes posible.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="min-h-11 rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Enviar otro mensaje
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>

      {/* Contact reason */}
      <FieldWrapper
        label="Motivo de contacto"
        htmlFor="contactReason"
        error={errors.contactReason as { message?: string } | undefined}
      >
        <Controller
          name="contactReason"
          control={control}
          render={({ field }) => (
            // Radix emite "" al montar y borraría el motivo precargado por URL.
            <Select onValueChange={(v) => v && field.onChange(v)} value={field.value ?? ""}>
              <SelectTrigger
                id="contactReason"
                aria-invalid={Boolean(errors.contactReason)}
                className={cn(
                  // Override SelectTrigger defaults to match inputs exactly
                  "w-full rounded-xl border bg-white px-3.5 py-2.5 h-auto text-sm text-[#09090B] transition-[color,background-color,border-color,box-shadow,transform,opacity]",
                  "focus-visible:ring-2 focus-visible:outline-none",
                  errors.contactReason
                    ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100"
                    : "border-[#E4E4E7] focus-visible:border-[#E63946] focus-visible:ring-[#E63946]/10",
                )}
              >
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_REASONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldWrapper>

      {/* Email + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrapper label="Correo electrónico" htmlFor="email" error={errors.email}>
          <input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            aria-invalid={Boolean(errors.email)}
            className={inputCls(Boolean(errors.email))}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Número de teléfono"
          htmlFor="phoneNumber"
          error={errors.phoneNumber}
          optional
        >
          <input
            {...register("phoneNumber")}
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            aria-invalid={Boolean(errors.phoneNumber)}
            className={inputCls(Boolean(errors.phoneNumber))}
          />
        </FieldWrapper>
      </div>

      {/* Message */}
      <FieldWrapper label="Mensaje" htmlFor="message" error={errors.message}>
        <div className={cn(
          "overflow-hidden rounded-xl border transition-[color,background-color,border-color,box-shadow,transform,opacity] focus-within:ring-2",
          errors.message
            ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-[#E4E4E7] focus-within:border-[#E63946] focus-within:ring-[#E63946]/10",
        )}>
          <textarea
            {...register("message")}
            id="message"
            rows={5}
            placeholder="Cuéntanos cómo podemos ayudarte..."
            aria-invalid={Boolean(errors.message)}
            className="w-full resize-none bg-white px-3.5 pt-3 pb-2 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none"
          />
          <div className="flex items-center justify-end border-t border-[#F4F4F5] bg-[#FAFAFC] px-3.5 py-1.5">
            <span
              className={cn(
                "text-xs tabular-nums",
                messageValue.length > 900
                  ? "text-red-500"
                  : messageValue.length > 800
                    ? "text-amber-500"
                    : "text-[#A1A1AA]",
              )}
            >
              {messageValue.length}/1000
            </span>
          </div>
        </div>
      </FieldWrapper>

      {/* Submit error */}
      <AnimatePresence>
        {submitError && (
          <motion.p
            key="submit-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {submitError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3 text-sm font-semibold text-white shadow-primary-glow transition-[color,background-color,border-color,box-shadow,transform,opacity] hover:bg-[#9B0A26] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Enviando…
          </>
        ) : (
          <>
            Enviar mensaje
            <Send className="size-4" aria-hidden />
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#A1A1AA]">
        Te responderemos al correo que indiques.
      </p>
    </form>
  );
}
