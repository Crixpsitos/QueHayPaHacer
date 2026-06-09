import { Check, FileText, Tag, Image, MapPin, Calendar, Users, DollarSign, CheckCircle} from "lucide-react";
import { STEPS } from "../../constants/steps";

const stepIcons = {
  FileText,
  Image,
  Tag,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
};

interface StepperProps {
    currentStep: number;
    completedSteps: number[];
    canAccessStep: (stepNumber: number) => boolean;
    handleStepClick: (stepNumber: number) => void;
    
}

const Stepper = ({ currentStep, completedSteps, canAccessStep, handleStepClick }: StepperProps) => {
  return (
    <div className="border-b border-gray-200 bg-white">
        <div className="overflow-x-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {STEPS.map((step) => {
              const Icon = stepIcons[step.icon as keyof typeof stepIcons];
              const isCompleted = completedSteps.includes(step.number);
              const isCurrent = currentStep === step.number;
              const isAccessible = canAccessStep(step.number);

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isAccessible}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors ${
                    isAccessible
                      ? "cursor-pointer hover:bg-gray-50"
                      : "cursor-not-allowed opacity-50"
                  } ${isCurrent ? "bg-gray-50" : ""}`}
                  aria-label={`Step ${step.number}: ${step.label}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div
                    className={`flex size-12 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "border-black bg-black text-white"
                        : isCurrent
                          ? "border-black bg-white text-black"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-7" />
                    ) : (
                      <Icon className="size-7" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-black" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

  )
}

export default Stepper; 