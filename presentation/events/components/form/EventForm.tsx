"use client";

import { Section } from "@/app/components/layout/shared/Section";
import EventStickyHeader from "../ui/EventStickyHeader";
import Stepper from "../ui/Stepper";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { safeParse, type BaseSchema, type BaseIssue } from "valibot";
import { Step1BasicInfo } from "../steps/Step1BasicInfo";
import { Button } from "@/app/components/ui/button";
import { STEPS, MULTI_DATE_HEADER_STEPS } from "../../constants/steps";
import { Step2Media } from "../steps/Step2Media";
import { Step3Clasification } from "../steps/Step3Clasification";
import { Step4Location } from "../steps/Step4Location";
import { Step5Dates } from "../steps/Step5Dates";
import { Step6Registration } from "../steps/Step6Registration";
import { Step7Pricing } from "../steps/Step7Pricing";
import { Step8Review } from "../steps/Step8Review";
import { StepSessionsManager } from "../steps/StepSessionsManager";
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

type StepSchema =
  | typeof step1Schema
  | typeof step2Schema
  | typeof step3Schema
  | typeof step4Schema
  | typeof step5Schema
  | typeof step6Schema
  | typeof step7Schema
  | typeof step8Schema;

const standardStepSchema: StepSchema[] = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
];

/** Para multi-date: 5 pasos (encabezado + sesiones + promoción). */
const multiDateHeaderSchema: StepSchema[] = [
  step1Schema, // 1: Información básica
  step2Schema, // 2: Portada principal
  step3Schema, // 3: Clasificación
  step8Schema, // 4: Sesiones (step8 tiene promotion opcional → pasa trivialmente)
  step8Schema, // 5: Promoción
];

const { eventsRepository } = createClientContainer();

interface EventFormProps {
  mode: "create" | "edit";
  eventType?: "standard" | "multi-date";
  initialData?: Partial<FormEventDto>;
  onPublish: (data: FormEventDto) => Promise<void>;
  onSaveDraft: (data: FormEventDto) => Promise<Events | null>;
}

export const EventForm = ({
  mode,
  eventType = "standard",
  initialData,
  onPublish,
  onSaveDraft,
}: EventFormProps) => {
  const isMultiDate = eventType === "multi-date";
  const stepSchema = isMultiDate ? multiDateHeaderSchema : standardStepSchema;
  const ACTIVE_STEPS = isMultiDate ? MULTI_DATE_HEADER_STEPS : STEPS;
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // helper to log unexpected step changes during debugging
  const goToStep = (stepNumber: number) => {
    // eslint-disable-next-line no-console
    console.log("[EventForm] goToStep ->", stepNumber);
    // eslint-disable-next-line no-console
    console.trace();
    setCurrentStep(stepNumber);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  // mountedRef prevents subsequent prop updates (saveDraft) from auto-advancing steps
  const mountedRef = useRef(false);

  const progressPercentage = useMemo(
    () => (currentStep / ACTIVE_STEPS.length) * 100,
    [currentStep, ACTIVE_STEPS.length],
  );

  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

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
    // Run only once on mount for edit mode to avoid auto-advancing after draft saves.
    if (mode === "edit" && initialData && !mountedRef.current) {
      const validSteps: number[] = [];
      let firstIncomplete = 1;
      let hasIncomplete = false;

      for (let i = 0; i < stepSchema.length; i++) {
        const stepNum = i + 1;
        const result = safeParse(stepSchema[i], defaultFormValues);
        
        if (result.success) {
          validSteps.push(stepNum);
        } else if (!hasIncomplete) {
          firstIncomplete = stepNum;
          hasIncomplete = true;
        }
      }

      setCompletedSteps(validSteps);
      goToStep(hasIncomplete ? firstIncomplete : 1);
      mountedRef.current = true;
    }
  }, [mode, initialData, defaultFormValues]);

  // Reset form when entering create mode with no initialData (e.g., after publishing)
  useEffect(() => {
    if (mode === "create" && !initialData) {
      form.reset(defaultFormValues as unknown as FormEventDto);
      setCurrentStep(1);
      setCompletedSteps([]);
      mountedRef.current = false;
    }
  }, [mode, initialData, form, defaultFormValues]);

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
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    if (currentStep < ACTIVE_STEPS.length) {
      goToStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, completedSteps, form, ACTIVE_STEPS.length]);

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

  // Vuelve a la página anterior; si no hay historial (entrada directa), va al perfil.
  const navigateAway = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/profile/events");
    }
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
    if (isMultiDate) {
      // 5-step header form for multi-date events
      switch (currentStep) {
        case 1: return <Step1BasicInfo form={form} />;
        case 2: return <Step2Media form={form} saveDraftEvent={handleDraftSubmit} hideMedia />;
        case 3: return <Step3Clasification form={form} />;
        case 4: return <StepSessionsManager form={form} onSaveDraft={handleDraftSubmit} />;
        case 5: return <Step8Review form={form} onGoToStep={handleStepClick} isMultiDate />;
        default: return null;
      }
    }

    switch (currentStep) {
      case 1:
        return <Step1BasicInfo form={form} />;
      case 2:
        return <Step2Media form={form} saveDraftEvent={handleDraftSubmit} />;
      case 3:
        return <Step3Clasification form={form} />;
      case 4:
        return <Step4Location form={form} />;
      case 5:
        return <Step5Dates form={form} />;
      case 6:
        return <Step6Registration form={form} />;
      case 7:
        return <Step7Pricing form={form} />;
      case 8:
        return <Step8Review form={form} onGoToStep={handleStepClick} />;
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
  const isMediaProcessing = mediaItems.some(item => item.data.status === "processing");
  const isMainImageReady = Boolean(mainImage?.url);
  const isNextDisabled =
    isSubmitting ||
    (currentStep === 2 && (!isMainImageReady || isImageProcessing || isMediaProcessing || hasMainImageError));

  

  return (
    <div className="flex flex-col min-h-dvh">
      <EventStickyHeader
        progressPercentage={progressPercentage}
        onRequestExit={handleRequestExit}
      />
      <Stepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        canAccessStep={canAccessStep}
        handleStepClick={handleStepClick}
        steps={ACTIVE_STEPS}
      />
      <Section spacing="sm" className="flex-1">
        <FormProvider {...form}>
          <FormRemoteDataSyncer 
            recordId={eventId}
            subscribeToChanges={(id, callback) => eventsRepository.findByIdOnSnapshot(id, callback)}
          />

          <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
            {renderStep()}
          </form>
        </FormProvider>
      </Section>
      <div className="sticky bottom-0 border-t border-gray-200 bg-white z-30">
        <div className="flex items-center justify-between px-4 py-4 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="border border-transparent text-gray-600 hover:border-gray-300 hover:text-black disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Atrás
          </Button>

          <div className="flex gap-3">
            {status === "draft" && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() =>
                  notify.promise(handleDraftSubmit(), {
                    loading: "Guardando borrador...",
                    success: () =>
                      "Evento guardado como borrador exitosamente.",
                    error: "Error al guardar el evento como borrador",
                  })
                }
                className="border border-black text-black bg-white hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Guardar Como Borrador
              </Button>
            )}

            {currentStep === ACTIVE_STEPS.length ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishSubmit}
                className="bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                {isEditingExisting && status === "published"
                  ? "Actualizar Evento"
                  : "Publicar Evento"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isNextDisabled}
                onClick={handleNext}
                className="bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      </div>
     <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
  <DialogContent className="border-gray-200 sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">
        {status === "published" 
          ? "¿Salir de la edición del evento?" 
          : "¿Cancelar creación del evento?"}
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        {status === "published"
          ? "Tienes modificaciones que no se han guardado en tu evento publicado. ¿Qué deseas hacer?"
          : "Si sales ahora, perderás todos los cambios que no hayas guardado en este borrador. ¿Cómo deseas proceder?"}
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleExitWithoutSaving}
        className="border border-gray-900 text-gray-900 hover:bg-gray-100"
      >
        {status === "published" ? "Salir sin guardar cambios" : "Salir sin guardar"}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          notify.promise(handleExitWithSaving(), {
            loading: status === "published" ? "Guardando cambios..." : "Guardando borrador...",
            success: () => status === "published" ? "Cambios guardados exitosamente." : "Evento guardado como borrador exitosamente.",
            error: status === "published" ? "Error al guardar los cambios." : "Error al guardar el evento como borrador",
          })
        }
        className="border-gray-900 text-gray-900 hover:bg-gray-100"
      >
        {status === "published" ? "Guardar cambios y salir" : "Guardar como borrador y salir"}
      </Button>
      
      <Button
        type="button"
        onClick={() => setShowCancelDialog(false)}
        className="bg-black text-white hover:bg-gray-800"
      >
        Seguir editando
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
};