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
  CreateEventDto,
} from "@/application/dto/events/EventDto";

type StepSchema =
  | typeof step1Schema
  | typeof step2Schema
  | typeof step3Schema
  | typeof step4Schema
  | typeof step5Schema
  | typeof step6Schema
  | typeof step7Schema
  | typeof step8Schema;
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

export const EventCreationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  //memos

  const progressPercentage = useMemo(
    () => (currentStep / STEPS.length) * 100,
    [currentStep],
  );

  //ref
  const formRef = useRef<HTMLFormElement>(null);

  //form

  const form = useForm<CreateEventDto>({
    resolver: valibotResolver(
      stepSchema[currentStep - 1] as unknown as BaseSchema<
        CreateEventDto,
        CreateEventDto,
        BaseIssue<unknown>
      >,
    ),
    defaultValues: {
      title: "",
      shortDescription: "",
      description: {
        type: "doc",
        content: [],
        attrs: {},
      },
      categoryInfo: {
        id: "",
        title: "",
        slug: "",
        tags: [],
      },
      location: {
        country: "",
        department: "",
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
      status: "draft",
      registrationType: "none",
      externalUrl: "",
      capacity: 0,
      price: {
        isFree: true,
        amount: 0,
        currency: "COP",
      },
      promotion: {
        isPromoted: false,
        promotedAt: "",
        promotedUntil: "",
      },
    } as unknown as CreateEventDto,
    mode: "onChange",
  });
  //functions

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Suspense>
            <Step1BasicInfo form={form} />
          </Suspense>
        );
      case 2:
        return <Step2Media form={form} />;
      
      case 3:
        return <Step3Clasification form={form} />;
      
      case 4:
        return <Step4Location form={form} />;
      
      case 5:
        return <Step5Dates form={form} />;
      case 6:
        return <Step6Registration form={form} />;
      
      default:
        return null;
    }
  };

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
          <form ref={formRef}>{renderStep()}</form>
        </FormProvider>
      </Section>
      <div className="sticky bottom-0 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border border-transparent text-gray-600 hover:border-gray-300 hover:text-black disabled:opacity-50"
          >
            Atras
          </Button>

          <div className="flex gap-3">
            {currentStep === 8 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => console.log("Save as draft")}
                  className="border-black text-black hover:bg-gray-50"
                >
                  Guardar Como Borrador
                </Button>
                <Button
                  type="button"
                  onClick={() => console.log("Publish event")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Publicar Evento
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-black text-white hover:bg-gray-800"
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
