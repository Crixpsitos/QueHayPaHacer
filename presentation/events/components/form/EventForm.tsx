"use client";

import { Section } from "@/app/components/layout/shared/Section";
import EventStickyHeader from "../ui/EventStickyHeader";
import Stepper from "../ui/Stepper";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Suspense } from "react";
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
  EventDto,
} from "@/application/dto/events/EventDto";
import { valibotResolver } from "@hookform/resolvers/valibot";
import type { BaseSchema, BaseIssue } from "valibot";
import { Step1BasicInfo } from "../steps/Step1BasicInfo";
import { Button } from "@/app/components/ui/button";
import { STEPS } from "../../constants/steps";
import { Step2Media } from "../steps/Step2Media";
import { Step3Clasification } from "../steps/Step3Clasification";
import { Step4Location } from "../steps/Step4Location";
import { Step5Dates } from "../steps/Step5Dates";
import { Step6Registration } from "../steps/Step6Registration";
import { Step7Pricing } from "../steps/Step7Pricing";
import { Step8Review } from "../steps/Step8Review";
import { Events } from "@/domain/entities/events/Events";

type StepSchema =
  | typeof step1Schema
  | typeof step2Schema
  | typeof step3Schema
  | typeof step4Schema
  | typeof step5Schema
  | typeof step6Schema
  | typeof step7Schema
  | typeof step8Schema;

const stepSchema: StepSchema[] = [
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  step8Schema,
];

interface EventFormProps {
  mode: "create" | "edit";
  initialData?: Partial<FormEventDto>;
  onPublish: (data: FormEventDto) => Promise<void>;
  onSaveDraft: (data: FormEventDto) => Promise<Events | null>;
}

export const EventForm = ({
  mode,
  initialData,
  onPublish,
  onSaveDraft,
}: EventFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progressPercentage = useMemo(
    () => (currentStep / STEPS.length) * 100,
    [currentStep],
  );

  const formRef = useRef<HTMLFormElement>(null);

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
      mainImage: {},
      media: [],
      categoryInfo: {
        id: "",
        title: "",
        slug: "",
        tags: [],
      },
      location: {
        country: { isoCode: "", name: "" },
        department: { isoCode: "", name: "" },
        city: "",
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
        promotedAt: "",
        promotedUntil: "",
      },
      publishedAt: "",
      ...initialData,
    }),
    [initialData],
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

    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, completedSteps, form]);

  const handleStepClick = (stepNumber: number) => {
    if (!canAccessStep(stepNumber)) return;

    if (stepNumber < currentStep) {
      setCompletedSteps((prev) => prev.filter((s) => s < stepNumber));
    }

    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDraftSubmit = async () => {
    try {
      setIsSubmitting(true);

      const serializeData = {
        ...form.getValues(),
        description: JSON.parse(JSON.stringify(form.getValues("description"))),
      }

      const eventInfo = await onSaveDraft(serializeData);

      if (eventInfo?.id) {
        form.setValue("id", eventInfo.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

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
    switch (currentStep) {
      case 1:
        return (
          <Suspense>
            <Step1BasicInfo form={form} />
          </Suspense>
        );
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

  // ✅ Condición corregida — usa tempEventInfo?.id en lugar de tempEventId
  const isEditingExisting = mode === "edit" || !!form.watch("id");

  return (
    <>
      <EventStickyHeader
        progressPercentage={progressPercentage}
        setShowCancelDialog={() => {}}
      />
      <Stepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        canAccessStep={() => true}
        handleStepClick={handleStepClick}
      />
      <Section spacing="sm">
        <FormProvider {...form}>
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
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleDraftSubmit}
              className="border border-black text-black bg-white hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Guardar Como Borrador
            </Button>
            {currentStep === 8 ? (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishSubmit}
                className="bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                {isEditingExisting ? "Guardar Cambios" : "Publicar Evento"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleNext}
                className="bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Continuar
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
