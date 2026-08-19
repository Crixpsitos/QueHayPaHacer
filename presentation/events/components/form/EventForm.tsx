"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import {
  step1Schema,
  step8Schema,
  step7Schema,
  step6Schema,
  step5Schema,
  step4Schema,
  step3Schema,
  step2Schema,
  FormEventDto,
} from "@/application/dto/events/EventDto";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { type BaseSchema, type BaseIssue } from "valibot";
import { getTiptapPlainText } from "@/application/dto/events/EventDto";
import { Step1BasicInfo } from "../steps/Step1BasicInfo";
import { Button } from "@/app/components/ui/button";
import { Step2Media } from "../steps/Step2Media";
import { Step3Clasification } from "../steps/Step3Clasification";
import { Step4Location } from "../steps/Step4Location";
import { Step5Dates } from "../steps/Step5Dates";
import { Step6Registration } from "../steps/Step6Registration";
import { Step7Pricing } from "../steps/Step7Pricing";
import { Step8Review } from "../steps/Step8Review";
import { StepSessionsManager } from "../steps/StepSessionsManager";
import { StepCollaborators } from "../steps/StepCollaborators";
import { useAuth } from "@/app/store/auth/AuthContext";
import { Events } from "@/domain/entities/events/Events";
import { notify } from "@/presentation/shared/lib/notify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { useRouter } from "next/navigation";
import { FormRemoteDataSyncer } from "./FormRemoteDataSyncer";
import { createClientContainer } from "@/infraestructure/di/container.client";
import {
  X, Check, ChevronLeft, ChevronRight, Image as ImageIcon,
  CalendarDays, MapPin, Users,
} from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from "@/app/components/ui/avatar";

type StepSchema =
  | typeof step1Schema
  | typeof step2Schema
  | typeof step3Schema
  | typeof step4Schema
  | typeof step5Schema
  | typeof step6Schema
  | typeof step7Schema
  | typeof step8Schema;

type StepKey =
  | "basic"
  | "media"
  | "class"
  | "location"
  | "dates"
  | "registration"
  | "pricing"
  | "sessions"
  | "collab"
  | "review"
  | "promo";

interface StepDef {
  key: StepKey;
  label: string;
  icon: string;
  schema: StepSchema;
}

const { eventsRepository } = createClientContainer();

/** Determina qué pasos tienen datos reales válidos, nunca basándose en valores default. */
function computeCompletedSteps(
  values: Partial<FormEventDto>,
  steps: StepDef[],
  sessionCount: number,
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let ok = false;
    switch (step.key) {
      case "basic":
        ok =
          (values.title?.trim().length ?? 0) >= 10 &&
          (values.shortDescription?.trim().length ?? 0) >= 20 &&
          getTiptapPlainText(values.description).trim().length > 0;
        break;
      case "media":
        ok = Boolean(values.mainImage?.url?.trim());
        break;
      case "class":
        ok =
          Boolean(values.categoryInfo?.id?.trim()) &&
          Boolean(values.categoryInfo?.slug?.trim());
        break;
      case "location":
        ok =
          Boolean(values.location?.country?.isoCode?.trim()) &&
          Boolean(values.location?.city?.name?.trim()) &&
          Boolean(values.location?.venue?.trim()) &&
          Boolean(values.location?.address?.trim());
        break;
      case "dates":
        ok =
          Boolean(values.startDate?.trim()) &&
          Boolean(values.endDate?.trim()) &&
          !isNaN(new Date(values.startDate!).getTime()) &&
          !isNaN(new Date(values.endDate!).getTime()) &&
          new Date(values.endDate!) >= new Date(values.startDate!);
        break;
      case "registration":
        ok =
          Boolean(values.registrationType) &&
          (values.registrationType !== "external" ||
            Boolean(values.externalUrl?.trim()));
        break;
      case "pricing":
        ok =
          values.price?.isFree === true ||
          ((values.price?.amount ?? 0) > 0 &&
            Boolean(values.price?.currency?.trim()));
        break;
      case "sessions":
        ok = sessionCount >= 2;
        break;
      case "collab":
      case "promo":
      case "review":
        ok = true;
        break;
    }
    if (ok) completed.push(i + 1);
  }
  return completed;
}

interface EventFormProps {
  mode: "create" | "edit";
  eventType?: "standard" | "multi-date";
  initialData?: Partial<FormEventDto>;
  /** Paso inicial (1-based). Usado para abrir el form directo en un paso (p.ej. Sesiones). */
  initialStep?: number;
  onPublish: (data: FormEventDto) => Promise<void>;
  onSaveDraft: (data: FormEventDto) => Promise<Events | null>;
  /** Si se provee, el toggle “Varias fechas” llama este handler en lugar de hacer router.push directo. */
  onToggleEventType?: (formId?: string, formSnapshot?: FormEventDto) => void;
  /** Bloquea el toggle mientras el padre está ejecutando una migración. */
  isMigratingEventType?: boolean;
}

export const EventForm = ({
  mode,
  eventType = "standard",
  initialData,
  initialStep,
  onPublish,
  onSaveDraft,
  onToggleEventType,
  isMigratingEventType = false,
}: EventFormProps) => {
  const isMultiDate = eventType === "multi-date";
  const { user } = useAuth();
  // Step dinámico "Colaboradores": solo para cuentas profesionales, insertado antes
  // del último paso (Revisión / Promoción). Todo se deriva de `stepDefs`.
  const isProfessional = user?.customClaims?.role === "professional";

  const stepDefs: StepDef[] = useMemo(() => {
    const collab: StepDef = { key: "collab", label: "Colaboradores", icon: "Users", schema: step8Schema };
    if (isMultiDate) {
      const base: StepDef[] = [
        { key: "basic", label: "Información básica", icon: "FileText", schema: step1Schema },
        { key: "media", label: "Portada principal", icon: "Image", schema: step2Schema },
        { key: "class", label: "Clasificación", icon: "Tag", schema: step3Schema },
        { key: "sessions", label: "Sesiones", icon: "Calendar", schema: step8Schema },
        { key: "promo", label: "Promoción", icon: "Star", schema: step8Schema },
      ];
      return isProfessional ? [...base.slice(0, 4), collab, base[4]] : base;
    }
    const base: StepDef[] = [
      { key: "basic", label: "Información básica", icon: "FileText", schema: step1Schema },
      { key: "media", label: "Medios", icon: "Image", schema: step2Schema },
      { key: "class", label: "Clasificación", icon: "Tag", schema: step3Schema },
      { key: "location", label: "Ubicación", icon: "MapPin", schema: step4Schema },
      { key: "dates", label: "Fechas", icon: "Calendar", schema: step5Schema },
      { key: "registration", label: "Registro", icon: "Users", schema: step6Schema },
      { key: "pricing", label: "Precios", icon: "DollarSign", schema: step7Schema },
      { key: "review", label: "Revisión", icon: "CheckCircle", schema: step8Schema },
    ];
    return isProfessional ? [...base.slice(0, 7), collab, base[7]] : base;
  }, [isMultiDate, isProfessional]);

  const stepSchema = useMemo(() => stepDefs.map((s) => s.schema), [stepDefs]);
  const ACTIVE_STEPS = useMemo(
    () => stepDefs.map((s, i) => ({ number: i + 1, label: s.label, icon: s.icon })),
    [stepDefs],
  );
  const [currentStep, setCurrentStep] = useState(() =>
    initialStep && initialStep >= 1 && initialStep <= ACTIVE_STEPS.length
      ? initialStep
      : 1,
  );

  // Cuando cambia el tipo de evento (standard ↔ multi-date) el número de pasos cambia.
  // Si el paso actual ya no existe en el nuevo flujo, resetear al paso 1.
  useEffect(() => {
    setCurrentStep((prev) => (prev > ACTIVE_STEPS.length ? 1 : prev));
  }, [ACTIVE_STEPS.length]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Cuando el tipo de evento cambia (sin router.replace), recalcular la completitud.
  const prevEventTypeRef = useRef(eventType);
  useEffect(() => {
    if (prevEventTypeRef.current === eventType) return;
    prevEventTypeRef.current = eventType;
    // sessionCount=0 porque las sesiones del nuevo tipo aún no están cargadas.
    setCompletedSteps(computeCompletedSteps(form.getValues(), stepDefs, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType]);

  // helper to log unexpected step changes during debugging
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  // mountedRef prevents subsequent prop updates (saveDraft) from auto-advancing steps
  const mountedRef = useRef(false);

  const progressPercentage = useMemo(
    () => Math.round((currentStep / ACTIVE_STEPS.length) * 100),
    [currentStep, ACTIVE_STEPS.length],
  );

  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggleMultiDate = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", isMultiDate ? "standard" : "multi-date");
    const query = params.toString();
    router.push(query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }, [isMultiDate, router, searchParams]);

  const defaultFormValues = useMemo(
    () => ({
      id: initialData?.id ?? undefined,
      title: "",
      shortDescription: "",
      description: {
        type: "doc" as const,
        content: [],
        attrs: {},
      },
      mainImage: initialData?.mainImage ?? undefined,
      media: [],
      categoryInfo: {
        id: "",
        title: "",
        slug: "",
        tags: [],
      },
      location: {
        country: { isoCode: "", name: "", slug: "" },
        department: { isoCode: "", name: "", slug: "" },
        city: { name: "", slug: "" },
        venue: "",
        address: "",
        moreInfo: "",
        coordinates: {
          lat: 0,
          lng: 0,
        },
      },
      startDate: "",
      endDate: "",
      status: "draft" as const,
      registrationType: "none" as const,
      externalUrl: "",
      registrationEventForm: {
        fields: [],
      },
      capacity: 0,
      requiresAttendance: false,
      price: {
        isFree: true,
        amount: 0,
        currency: "COP",
      },
      author: {
        id: "",
        displayName: "",
        photoURL: "",
      },
      promotion: {
        isPromoted: false,
        promotedAt: null,
        promotedUntil: null,
      },
      publishedAt: "",
      eventType: eventType,
      collaborators: [],
      collaboratorsData: {},
      ...initialData,
    }),
    [initialData, eventType],
  );

  const form = useForm<FormEventDto>({
    resolver: valibotResolver(
      stepSchema[currentStep - 1] as unknown as BaseSchema<
        FormEventDto,
        FormEventDto,
        BaseIssue<unknown>
      >,
    ),
    defaultValues: defaultFormValues as unknown as FormEventDto,
    mode: "onChange",
  });

  useEffect(() => {
    // Se ejecuta una sola vez al montar en modo edición para calcular completitud real.
    // sessionCount=0: el efecto de conteo de sesiones actualizará ese paso al cargar.
    if (mode === "edit" && initialData && !mountedRef.current) {
      const validSteps = computeCompletedSteps(defaultFormValues, stepDefs, 0);

      let firstIncomplete = 1;
      let hasIncomplete = false;
      for (let i = 0; i < stepDefs.length; i++) {
        if (!validSteps.includes(i + 1)) {
          firstIncomplete = i + 1;
          hasIncomplete = true;
          break;
        }
      }

      setCompletedSteps(validSteps);
      // initialStep (p.ej. ?step=sessions) tiene prioridad sobre el auto-avance.
      const targetStep =
        initialStep && initialStep >= 1 && initialStep <= ACTIVE_STEPS.length
          ? initialStep
          : hasIncomplete
            ? firstIncomplete
            : 1;
      goToStep(targetStep);
      mountedRef.current = true;
    }
  }, [mode, initialData, defaultFormValues, initialStep, ACTIVE_STEPS.length, stepDefs]);

  // Ref para leer los últimos defaultFormValues sin que el reset effect reaccione
  // a sus cambios (evita el reset accidental cuando solo cambia eventType).
  const defaultFormValuesRef = useRef(defaultFormValues);
  useEffect(() => { defaultFormValuesRef.current = defaultFormValues; });

  // Reset form when entering create mode with no initialData (e.g., after publishing).
  // defaultFormValues se excluye del array de deps a propósito: no queremos
  // resetear el formulario cada vez que el usuario cambia de standard a multi-date.
  useEffect(() => {
    if (mode === "create" && !initialData) {
      form.reset(defaultFormValuesRef.current as unknown as FormEventDto);
      setCurrentStep(1);
      setCompletedSteps([]);
      mountedRef.current = false;
    }
  }, [mode, initialData, form]);

  // Sincroniza el campo eventType del formulario cuando cambia el tipo
  // (sin resetear el resto de campos — esto preserva el estado del usuario).
  useEffect(() => {
    form.setValue("eventType", eventType, { shouldDirty: false, shouldValidate: false });
  }, [eventType, form]);

  const status = form.watch("status");
  // Suscripción a isDirty (debe leerse en render para que RHF la rastree).
  const isDirty = form.formState.isDirty;

  const canAccessStep = useCallback(
    (stepNumber: number) => {
      if (stepNumber === 1) return true;
      for (let i = 1; i < stepNumber; i++) {
        if (!completedSteps.includes(i)) return false;
      }
      return true;
    },
    [completedSteps],
  );

  const handleNext = useCallback(async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      console.log(
        "❌ Errores activos en el paso actual:",
        form.formState.errors,
      );
      const firstError = formRef.current?.querySelector(
        '[aria-invalid="true"]',
      );
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      // El paso "Sesiones" se gestiona exclusivamente por el efecto de conteo;
      // nunca marcarlo completo al navegar (requiere sessionCount >= 2).
      if (stepDefs[currentStep - 1]?.key !== "sessions") {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
    }

    if (currentStep < ACTIVE_STEPS.length) {
      goToStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, completedSteps, form, ACTIVE_STEPS.length, stepDefs]);

  const handleStepClick = (stepNumber: number) => {
    if (!canAccessStep(stepNumber)) return;


    goToStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }  };

  const handleDraftSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const serializeData = {
        ...form.getValues(),
        description: JSON.parse(JSON.stringify(form.getValues("description"))),
        // Garantiza que eventType siempre se persiste aunque no esté en los valores del form
        eventType: eventType,
      };

      const eventInfo = await onSaveDraft(serializeData);

      if (eventInfo?.id) {
        form.setValue("id", eventInfo.id);
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSaveDraft, eventType]);

  // router.back() puede devolver a la misma ruta u otra inesperada; push a "/" es predecible.
  const navigateAway = useCallback(() => {
    router.push("/");
  }, [router]);

  // La "X" del header pide salir: solo mostramos el modal si hay cambios sin guardar.
  const handleRequestExit = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      navigateAway();
    }
  }, [isDirty, navigateAway]);

  const handleExitWithoutSaving = useCallback(async () => {
    setShowCancelDialog(false);
    startTransition(() => navigateAway());
  }, [navigateAway]);

  const handleExitWithSaving = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await handleDraftSubmit();
      setShowCancelDialog(false);
      navigateAway();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [handleDraftSubmit, navigateAway]);


  const handlePublishSubmit = async () => {
    // Ensure mainImage is present before publishing
    const values = form.getValues();
    if (!values.mainImage || !values.mainImage?.url) {
      form.setError("mainImage", {
        type: "required",
        message: "La imagen principal es obligatoria para publicar",
      });
      setCurrentStep(2);
      const firstError = formRef.current?.querySelector('[aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      console.log(
        "❌ Errores activos en el paso actual:",
        form.formState.errors,
      );
      const firstError = formRef.current?.querySelector(
        '[aria-invalid="true"]',
      );
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setIsSubmitting(true);
      await onPublish(form.getValues());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (stepDefs[currentStep - 1]?.key) {
      case "basic":
        return <Step1BasicInfo form={form} />;
      case "media":
        return <Step2Media form={form} saveDraftEvent={handleDraftSubmit} hideMedia={isMultiDate} />;
      case "class":
        return <Step3Clasification form={form} />;
      case "location":
        return <Step4Location form={form} />;
      case "dates":
        return <Step5Dates form={form} />;
      case "registration":
        return <Step6Registration form={form} />;
      case "pricing":
        return <Step7Pricing form={form} />;
      case "sessions":
        return <StepSessionsManager form={form} onSaveDraft={handleDraftSubmit} onSessionsChange={setSessionCount} />;
      case "collab":
        return <StepCollaborators form={form} />;
      case "promo":
      case "review":
        return <Step8Review form={form} onGoToStep={handleStepClick} isMultiDate={isMultiDate} />;
      default:
        return null;
    }
  };

  const isEditingExisting = mode === "edit";
  const eventId = form.watch("id");
  const mainImage = form.watch("mainImage");
  const mediaItems = form.watch("media") ?? [];
  const mainImageStatus = mainImage?.status;
  const hasMainImageError = Boolean(form.formState.errors.mainImage);
  const isImageProcessing = mainImageStatus === "processing";
  const isMediaProcessing = mediaItems.some((item) => item.data.status === "processing");
  const isMainImageReady = Boolean(mainImage?.url);
  const isNextDisabled =
    isSubmitting ||
    (currentStep === 2 && (!isMainImageReady || isImageProcessing || isMediaProcessing || hasMainImageError));

  // Conteo de sesiones para el checklist de publicación en multi-fecha.
  const [sessionCount, setSessionCount] = useState(0);
  useEffect(() => {
    if (!isMultiDate || !eventId) return;
    fetch(`/api/events/${eventId}/sessions`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => setSessionCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [isMultiDate, eventId]);

  // Sincronizar la completitud del paso "Sesiones" con el conteo real de sesiones.
  useEffect(() => {
    if (!isMultiDate) return;
    const idx = stepDefs.findIndex((s) => s.key === "sessions");
    if (idx < 0) return;
    const stepNum = idx + 1;
    const isDone = sessionCount >= 2;
    setCompletedSteps((prev) => {
      const had = prev.includes(stepNum);
      if (isDone && !had) return [...prev, stepNum].sort((a, b) => a - b);
      if (!isDone && had) return prev.filter((n) => n !== stepNum);
      return prev;
    });
  }, [sessionCount, isMultiDate, stepDefs]);

  const previewTitle = form.watch("title");
  const previewShortDesc = form.watch("shortDescription");
  const previewImage = form.watch("mainImage");
  const previewCategoryInfo  = form.watch("categoryInfo");
  const previewCategory       = previewCategoryInfo?.title;
  const previewTags           = previewCategoryInfo?.tags;
  const previewStartDate = form.watch("startDate");
  const previewVenue = form.watch("location.venue");
  const previewCity = form.watch("location.city.name");
  const previewIsFree = form.watch("price.isFree");
  const previewAmount = form.watch("price.amount");
  const previewRegistrationType = form.watch("registrationType");
  const previewCollaboratorsData = form.watch("collaboratorsData");
  const previewDescription = form.watch("description");
  const hasDescription = Boolean(previewDescription?.content && previewDescription.content.length > 0);

  const REGISTRATION_LABELS: Record<string, string> = {
    none:     "Sin registro · entrada libre",
    internal: "Registro en la plataforma",
    external: "Registro externo",
    form:     "Formulario de inscripción",
  };
  const registrationLabel = (previewRegistrationType && REGISTRATION_LABELS[previewRegistrationType]) ?? "Sin registro · entrada libre";

  const currentStepDef = stepDefs[currentStep - 1];

  // Mapa de títulos y textos de ayuda por paso
  const STEP_META: Partial<Record<StepKey, { title: string; subtitle: string }>> = {
    basic:        { title: "Cuéntanos qué va a pasar", subtitle: "El título y el gancho son lo único que la gente ve en el listado. Sé concreto: qué es, para quién y qué lo hace distinto." },
    media:        { title: "Imagen de tu evento", subtitle: "Una buena imagen aumenta hasta 3× las visitas. Usa 1920×1080 px o superior." },
    class:        { title: "Ayuda a que lo encuentren", subtitle: "La categoría define en qué sección aparece. Las etiquetas alimentan la búsqueda y las recomendaciones del feed." },
    location:     { title: "¿Dónde ocurre?", subtitle: "La ubicación precisa mejora la asistencia y el posicionamiento en búsquedas." },
    dates:        { title: "Cuándo empieza y cuándo cierra", subtitle: "Mostramos la hora local. Si el plan cruza la medianoche, deja el cierre en el día siguiente: el listado lo entiende." },
    registration: { title: "¿Cómo se apunta la gente?", subtitle: "Elige el camino más corto para tu público. Puedes cambiarlo después sin perder los registros existentes." },
    pricing:      { title: "Precio de la entrada", subtitle: "Si el evento es gratis, dilo claro: los planes gratuitos reciben el doble de clics en el feed." },
    sessions:     { title: "Sesiones del evento", subtitle: "Agrega y administra cada sesión de tu evento multi-fecha con fechas y lugares propios." },
    collab:       { title: "Colaboradores", subtitle: "Acredita al equipo que hace posible el evento. Puedes asignar roles de editor, visualizador o crédito." },
    review:       { title: "Revisión final", subtitle: "Verifica que todo esté correcto. Una vez publicado, el evento será visible para todos." },
    promo:        { title: "Promover evento", subtitle: "Maximiza la visibilidad de tu evento con opciones de promoción." },
  };
  const currentMeta = STEP_META[currentStepDef?.key as StepKey];

  // Checklist "Listo para publicar"
  const categoryId = form.watch("categoryInfo.id");
  const publishChecklist = [
    { label: "Título y gancho completos",    ok: Boolean(previewTitle && previewTitle.length >= 10 && previewShortDesc && previewShortDesc.length >= 20 && hasDescription) },
    { label: "Imagen principal procesada",   ok: Boolean(previewImage?.url && previewImage?.status === "ready") },
    { label: "Categoría asignada",           ok: Boolean(categoryId) },
    ...(!isMultiDate ? [
      { label: "Fechas y lugar definidos",   ok: Boolean(previewStartDate && previewCity) },
      { label: "Registro configurado",       ok: true },
      { label: "Precio configurado",         ok: previewIsFree === true || (!!previewAmount && previewAmount > 0) },
    ] : [
      { label: "Mínimo 2 sesiones configuradas", ok: sessionCount >= 2 },
    ]),
  ];
  const readyCount  = publishChecklist.filter((c) => c.ok).length;
  const isFullReady = readyCount === publishChecklist.length;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFC]">

      {/* ── HEADER STICKY ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#F4F4F5]">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8 lg:px-12">
          {/* Izquierda: X + título del evento */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleRequestExit}
              aria-label="Salir"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] transition-colors"
            >
              <X className="size-4" />
            </button>
            <p
              className="text-sm font-semibold text-[#09090B] truncate"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {previewTitle || "Nuevo evento"}
            </p>
          </div>

          {/* Derecha: switch varias fechas + guardar borrador */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Toggle funcional Varias fechas */}
            <label
              className={cn(
                "hidden sm:flex items-center gap-2 select-none",
                isMigratingEventType ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
              onClick={() => {
                if (isMigratingEventType) return;
                if (onToggleEventType) {
                  // Snapshot tomado ANTES del cambio de tipo para que la migración use datos reales.
                  onToggleEventType(form.getValues("id") ?? undefined, form.getValues());
                } else {
                  handleToggleMultiDate();
                }
              }}
            >
              <CalendarDays className="size-4 text-[#71717A]" />
              <span className="text-sm text-[#71717A] font-medium">Varias fechas</span>
              <span
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  isMultiDate ? "bg-[#E63946]" : "bg-[#E4E4E7]",
                )}
              >
                <span className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                  isMultiDate ? "translate-x-4" : "translate-x-0.5",
                )} />
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() =>
                notify.promise(handleDraftSubmit(), {
                  loading: "Guardando...",
                  success: () =>
                    mode === "edit" && status === "published"
                      ? "Cambios guardados."
                      : "Borrador guardado.",
                  error: "Error al guardar",
                })
              }
              className="border-[#E4E4E7] text-[#09090B] hover:bg-[#FAFAFC] rounded-lg text-sm"
            >
              {mode === "edit" && status === "published" ? "Guardar cambios" : "Guardar borrador"}
            </Button>
          </div>
        </div>

        {/* Barra de progreso móvil */}
        <div className="lg:hidden h-1 bg-[#F4F4F5]">
          <div className="h-full bg-[#E63946] transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
        </div>
      </header>

      {/* ── BODY CON CONTAINER ─────────────────────────────────── */}
      <div className="mx-auto flex-1 max-w-screen-2xl px-4 py-8 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr_300px]">

          {/* ── COL 1: PASOS + BADGES ──────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-16">
              {/* PROGRESO */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Progreso</p>
                  <span className="text-[11px] font-semibold text-[#E63946]">{progressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F4F4F5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E63946] transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#A1A1AA]">{completedSteps.length} de {ACTIVE_STEPS.length} pasos completados</p>
              </div>

              {/* Lista de pasos */}
              <ol className="space-y-0.5">
                {ACTIVE_STEPS.map((step, idx) => {
                  const isCompleted = completedSteps.includes(step.number);
                  const isCurrent   = currentStep === step.number;
                  const isAccessible = canAccessStep(step.number);

                  return (
                    <li key={step.number}>
                      <button
                        type="button"
                        onClick={() => handleStepClick(step.number)}
                        disabled={!isAccessible}
                        suppressHydrationWarning
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all",
                          isCurrent   ? "bg-[#FDF2F4] text-[#E63946]" :
                          isAccessible ? "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]" :
                                         "cursor-not-allowed text-[#71717A] opacity-40",
                        )}
                      >
                        <span className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all",
                          isCompleted ? "border-[#E63946] bg-[#E63946] text-white" :
                          isCurrent   ? "border-[#E63946] bg-white text-[#E63946]" :
                                        "border-[#E4E4E7] bg-white text-[#A1A1AA]",
                        )}>
                          {isCompleted ? <Check className="size-3" /> : step.number}
                        </span>
                        <span className="text-sm font-medium leading-tight truncate">
                          {step.label}
                        </span>
                      </button>
                      {idx < ACTIVE_STEPS.length - 1 && (
                        <div className={cn(
                          "ml-6 my-0.5 w-0.5 h-3",
                          completedSteps.includes(step.number) ? "bg-[#E63946]/40" : "bg-[#F4F4F5]",
                        )} />
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* Cuadro tipo de evento con descripción */}
              <div className="mt-4 rounded-xl border border-[#F4F4F5] bg-white p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <CalendarDays className="size-3.5 text-[#E63946] shrink-0" />
                  <p className="text-xs font-semibold text-[#09090B]">
                    {isMultiDate ? "Evento multi-fecha" : "Evento estándar"}
                  </p>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  {isMultiDate
                    ? "Múltiples sesiones bajo un mismo evento. Cada una con su propia fecha y lugar."
                    : "Un evento, una fecha. Activa \u201cvarias fechas\u201d si es un ciclo."
                  }
                </p>
              </div>
            </div>
          </aside>

          {/* ── COL 2: FORMULARIO ─────────────────────────────── */}
          <main className="min-w-0">
            {/* Título del paso */}
            <div className="mb-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                Paso {currentStep} · {ACTIVE_STEPS.length} en total
              </p>
              <h1
                className="text-2xl font-bold text-[#09090B]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {currentMeta?.title ?? currentStepDef?.label}
              </h1>
              {currentMeta?.subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-[#71717A] max-w-lg">
                  {currentMeta.subtitle}
                </p>
              )}
            </div>

            {/* Contenido del paso */}
            <FormProvider {...form}>
              <FormRemoteDataSyncer
                recordId={eventId}
                subscribeToChanges={(id, callback) => eventsRepository.findByIdOnSnapshot(id, callback)}
              />
              <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
                {renderStep()}
              </form>
            </FormProvider>
          </main>

          {/* ── COL 3: VISTA PREVIA ───────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-16">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Vista previa en vivo</p>

              <div className="rounded-2xl border border-[#F4F4F5] bg-white shadow-card overflow-hidden">
                <div className="relative aspect-video w-full bg-[#F4F4F5]">
                  {previewImage?.url ? (
                    <Image
                      src={previewImage.url}
                      alt="Preview"
                      fill
                      loading="eager"
                      className="object-cover"
                      sizes="300px"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#A1A1AA]">
                      <ImageIcon className="size-8 opacity-30" />
                      <p className="text-[11px]">Sin imagen</p>
                    </div>
                  )}
                  {previewCategory && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-[#E63946]">
                      {previewCategory}
                    </span>
                  )}
                  {/* Badge "listo para publicar" sobre imagen */}
                  {isFullReady && (
                    <span className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      <Check className="size-3" /> Listo para publicar
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {/* Título */}
                  <h3 className="text-base font-bold text-[#09090B] leading-snug">
                    {previewTitle || <span className="text-[#A1A1AA] font-normal">Título del evento</span>}
                  </h3>

                  {/* Gancho — 2 líneas con height mínimo para el placeholder */}
                  <p className={cn(
                    "text-xs leading-relaxed line-clamp-2 min-h-10",
                    previewShortDesc ? "text-[#71717A]" : "text-[#A1A1AA] italic",
                  )}>
                    {previewShortDesc || "El gancho corto es lo primero que la gente lee en el listado. Cuéntales por qué no se lo pueden perder."}
                  </p>

                  {/* Etiquetas */}
                  {previewTags && previewTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {previewTags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#71717A]"
                        >
                          {tag}
                        </span>
                      ))}
                      {previewTags.length > 5 && (
                        <span className="rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-2 py-0.5 text-[10px] font-medium text-[#A1A1AA]">
                          +{previewTags.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadatos con iconos */}
                  <div className="border-t border-[#F4F4F5] pt-2 space-y-1.5">
                    {/* AvatarGroup de colaboradores acreditados */}
                    {previewCollaboratorsData && Object.keys(previewCollaboratorsData).length > 0 && (
                      <div className="flex items-center gap-1.5 pb-1">
                        <AvatarGroup>
                          {Object.entries(previewCollaboratorsData).slice(0, 4).map(([refId, c]) => (
                            <Avatar key={refId} className="size-6">
                              <AvatarImage src={c.photoURL ?? undefined} alt={c.displayName} />
                              <AvatarFallback className="text-[9px] font-semibold">
                                {c.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {Object.keys(previewCollaboratorsData).length > 4 && (
                            <AvatarGroupCount className="size-6 text-[9px]">
                              +{Object.keys(previewCollaboratorsData).length - 4}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                        <span className="text-[10px] text-[#71717A]">
                          {Object.keys(previewCollaboratorsData).length} colaborador{Object.keys(previewCollaboratorsData).length > 1 ? "es" : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                      <CalendarDays className="size-3.5 text-[#E63946] shrink-0" />
                      <span className="font-medium text-[#09090B]">Fecha</span>
                      <span className="text-[#D4D4D8]">·</span>
                      <span>{previewStartDate ? new Date(previewStartDate).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" }) : "Fecha por definir"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                      <MapPin className="size-3.5 text-[#E63946] shrink-0" />
                      <span className="font-medium text-[#09090B]">Lugar</span>
                      <span className="text-[#D4D4D8]">·</span>
                      <span className="truncate">{previewVenue || previewCity || "Lugar por definir"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                      <Users className="size-3.5 text-[#E63946] shrink-0" />
                      <span className="font-medium text-[#09090B]">Registro</span>
                      <span className="text-[#D4D4D8]">·</span>
                      <span className="truncate">{registrationLabel}</span>
                    </div>
                  </div>

                  {/* Badge precio */}
                  <span className={cn(
                    "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    previewIsFree
                      ? "bg-emerald-50 text-emerald-700"
                      : (previewAmount && previewAmount > 0
                          ? "bg-[#FDF2F4] text-[#E63946]"
                          : "bg-[#F4F4F5] text-[#71717A]"),
                  )}>
                    {previewIsFree
                      ? "Gratis"
                      : (previewAmount && previewAmount > 0
                          ? `$${previewAmount.toLocaleString("es-CO")}`
                          : "Precio por definir")}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-[#A1A1AA]">Se actualiza en tiempo real</p>

              {/* Listo para publicar */}
              <div className={cn(
                "mt-4 rounded-xl border p-3 transition-colors",
                isFullReady ? "border-emerald-200 bg-emerald-50" : "border-[#F4F4F5] bg-white",
              )}>
                <p className={cn(
                  "mb-2.5 text-xs font-bold",
                  isFullReady ? "text-emerald-700" : "text-[#09090B]",
                )}>
                  Listo para publicar
                </p>
                <ul className="space-y-2">
                  {publishChecklist.map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className={cn(
                        "size-4 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        item.ok ? "bg-emerald-500" : "bg-[#F4F4F5]",
                      )}>
                        {item.ok && <Check className="size-2.5 text-white" />}
                      </span>
                      <span className={cn(
                        "text-xs leading-tight",
                        item.ok ? "text-[#52525B]" : "text-[#52525B] opacity-60",
                      )}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ── BARRA DE ACCIONES STICKY ────────────────────────────── */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-[#F4F4F5]">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 md:px-8 lg:px-12">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
              suppressHydrationWarning
            className="flex items-center gap-1.5 text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] disabled:opacity-40 rounded-xl px-3"
          >
            <ChevronLeft className="size-4" />
            Atrás
          </Button>

          <div className="flex items-center gap-2">
            {currentStep === ACTIVE_STEPS.length ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishSubmit}
                className="rounded-xl px-5 text-sm font-semibold bg-[#E63946] hover:bg-[#9B0A26] text-white shadow-primary-glow"
              >
                {isEditingExisting && status === "published" ? "Actualizar evento" : "Publicar evento"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isNextDisabled}
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl px-5 text-sm font-semibold bg-[#E63946] hover:bg-[#9B0A26] text-white disabled:opacity-50 shadow-primary-glow"
              >
                Continuar
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── DIALOG CANCELAR ─────────────────────────────────────── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-[#F4F4F5] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#09090B]">
              {status === "published" ? "¿Salir de la edición?" : "¿Cancelar creación del evento?"}
            </DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {status === "published"
                ? "Tienes modificaciones sin guardar. ¿Qué deseas hacer?"
                : "Si sales ahora, perderás los cambios no guardados."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleExitWithoutSaving}
              className="border-[#E4E4E7] text-[#09090B] hover:bg-[#FAFAFC] rounded-xl">
              {status === "published" ? "Salir sin guardar" : "Salir sin guardar"}
            </Button>
            <Button type="button" variant="outline"
              onClick={() => notify.promise(handleExitWithSaving(), {
                loading: "Guardando...", success: () => "Guardado.", error: "Error al guardar",
              })}
              className="border-[#E4E4E7] text-[#09090B] hover:bg-[#FAFAFC] rounded-xl">
              {status === "published" ? "Guardar y salir" : "Guardar borrador y salir"}
            </Button>
            <Button type="button" onClick={() => setShowCancelDialog(false)}
              className="rounded-xl bg-[#E63946] hover:bg-[#9B0A26] text-white">
              Seguir editando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
