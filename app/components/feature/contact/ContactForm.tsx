"use client";

import { useEffect, useTransition, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Bug, Calendar, CheckCircle2, Loader2, MapPin, Send } from "lucide-react";
import { useAuth } from "@/app/store/auth/AuthContext";
import { sendContactAction } from "@/app/actions/contact/send-contact.action";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/lib/utils/cn";

// ── Contact reasons ────────────────────────────────────────────────────────────

const CONTACT_REASON_VALUES = [
  "general_inquiry", "report_problem", "report_event", "report_site",
  "account_problem", "suggestion", "advertising_partnership", "other",
] as const;

type ContactReason = typeof CONTACT_REASON_VALUES[number];

const CONTACT_REASONS: { value: ContactReason; label: string }[] = [
  { value: "general_inquiry",         label: "Consulta general" },
  { value: "report_problem",          label: "Reportar un problema" },
  { value: "report_event",            label: "Reportar un evento" },
  { value: "report_site",             label: "Reportar un sitio" },
  { value: "account_problem",         label: "Problema con mi cuenta" },
  { value: "suggestion",              label: "Propuesta o sugerencia" },
  { value: "advertising_partnership", label: "Publicidad o alianzas" },
  { value: "other",                   label: "Otro" },
];

const QUICK_ACTIONS: { icon: React.ElementType; label: string; reason: ContactReason }[] = [
  { icon: Bug,      label: "Reportar un problema",    reason: "report_problem" },
  { icon: Calendar, label: "Problema con un evento",  reason: "report_event" },
  { icon: MapPin,   label: "Problema con un sitio",   reason: "report_site" },
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
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#71717A]"
      >
        {label}
        {optional && (
          <span className="normal-case tracking-normal font-normal text-[#A1A1AA]">(opcional)</span>
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
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-all bg-white focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-[#E4E4E7] focus:border-[#E63946] focus:ring-[#E63946]/10",
  );

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

  useEffect(() => {
    if (user?.email) setValue("email", user.email, { shouldValidate: true });
    if (user?.profile?.phoneNumber)
      setValue("phoneNumber", user.profile.phoneNumber, { shouldValidate: true });
  }, [user, setValue]);

  const messageValue = watch("message") ?? "";
  const selectedReason = watch("contactReason");

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
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-7 text-emerald-600" />
        </div>
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
          className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Enviar otro mensaje
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>

      {/* Quick actions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#71717A]">
          ¿Qué necesitas?
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(({ icon: Icon, label, reason }) => {
            const isSelected = selectedReason === reason;
            return (
              <button
                key={reason}
                type="button"
                onClick={() => setValue("contactReason", reason, { shouldValidate: true })}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/20",
                  isSelected
                    ? "border-[#E63946] bg-[#FDF2F4] text-[#E63946] font-semibold shadow-sm"
                    : "border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#E63946] hover:bg-[#FDF2F4] hover:text-[#E63946]",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

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
            <Select onValueChange={field.onChange} value={field.value ?? ""}>
              <SelectTrigger
                id="contactReason"
                aria-invalid={Boolean(errors.contactReason)}
                className={cn(
                  // Override SelectTrigger defaults to match inputs exactly
                  "w-full rounded-xl border bg-white px-3.5 py-2.5 h-auto text-sm text-[#09090B] transition-all",
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
          "overflow-hidden rounded-xl border transition-all focus-within:ring-2",
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
        className="flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3 text-sm font-semibold text-white shadow-primary-glow transition-all hover:bg-[#9B0A26] disabled:cursor-not-allowed disabled:opacity-50"
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
        Normalmente respondemos en poco tiempo.
      </p>
    </form>
  );
}
