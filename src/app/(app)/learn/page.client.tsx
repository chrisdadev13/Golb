"use client";

import { useMutation } from "convex/react";
import {
  Clock3,
  Clock4,
  Clock8,
  Clock12,
  Gamepad2,
  GraduationCap,
  type LucideIcon,
  PlayCircle,
  Star,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "#/components/icons";
import { Button } from "#/components/ui/button";
import { FancyButton } from "#/components/ui/fancy-button";
import { Input } from "#/components/ui/input";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from "#/components/ui/stepper";
import { api } from "../../../../convex/_generated/api";

type FormData = {
  learningGoal: string | null;
  customLearningGoal: string;
  experienceLevel: string | null;
  learningStyle: string | null;
  timeCommitment: string | null;
};

type StepData = {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  question: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
    icon: LucideIcon;
    image?: string;
  }>;
};

const steps = [1, 2, 3, 4];

const stepData: StepData[] = [
  {
    id: 1,
    title: "What do you want to learn?",
    icon: Icons.OkIcon,
    question: "What do you want to learn?",
    options: [],
  },
  {
    id: 2,
    title: "Experience Level",
    icon: Icons.Rank,
    question: "What's your experience with [selected subject]?",
    options: [
      { id: "beginner", label: "Complete beginner", icon: Star },
      {
        id: "basic",
        label: "Some basics",
        description: "high school level",
        icon: GraduationCap,
      },
      {
        id: "intermediate",
        label: "Intermediate",
        description: "1st semester college level",
        icon: Users,
      },
    ],
  },
  {
    id: 3,
    title: "Learning Style",
    icon: Icons.Diagram,
    question: "How do you learn best?",
    options: [
      {
        id: "concepts",
        label: "Learn concepts progressively",
        icon: PlayCircle,
        image: "/step-by-step.png",
      },
      {
        id: "problems",
        label: "Solve questions progressively",
        icon: Gamepad2,
        image: "/thinking.png",
      },
    ],
  },
  {
    id: 4,
    title: "Time Commitment",
    icon: Icons.Rocket,
    question: "How much time can you dedicate daily?",
    options: [
      { id: "10-15", label: "10-15 minutes", icon: Clock3 },
      { id: "20-30", label: "20-30 minutes", icon: Clock4 },
      { id: "45-60", label: "45-60 minutes", icon: Clock8 },
      { id: "60+", label: "1+ hours", icon: Clock12 },
    ],
  },
];

export function LearnPageClient() {
  const router = useRouter();
  const createCourse = useMutation(api.course.createCourse);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // name: "",
    learningGoal: null,
    customLearningGoal: "",
    experienceLevel: null,
    learningStyle: null,
    timeCommitment: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentStepData = () =>
    // biome-ignore lint/style/noNonNullAssertion: nah, dw
    stepData.find((step) => step.id === currentStep)!;

  const getCurrentSelection = () => {
    switch (currentStep) {
      case 1:
        return null;
      case 2:
        return formData.experienceLevel;
      case 3:
        return formData.learningStyle;
      case 4:
        return formData.timeCommitment;
      default:
        return null;
    }
  };

  const updateFormData = (value: string) => {
    setFormData((prev) => {
      switch (currentStep) {
        case 0:
          return prev;
        case 1:
          return prev; // step 1 uses free-text input via updateCustomLearningGoal
        case 2:
          return { ...prev, experienceLevel: value };
        case 3:
          return { ...prev, learningStyle: value };
        case 4:
          return { ...prev, timeCommitment: value };
        default:
          return prev;
      }
    });
  };

  const updateCustomLearningGoal = (value: string) => {
    setFormData((prev) => ({ ...prev, customLearningGoal: value }));
  };

  const handleSubmitProfile = async () => {
    console.log("handleSubmitProfile called", { canProceed, isSubmitting });

    if (!canProceed || isSubmitting) {
      console.log("Early return:", { canProceed, isSubmitting });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create course with the collected data
      if(!formData.experienceLevel || !formData.learningStyle || !formData.timeCommitment) return 

      const courseId = await createCourse({
        title: formData.customLearningGoal,
        description: `Learn ${formData.customLearningGoal} with ${formData.learningStyle} approach for ${formData.timeCommitment} daily`,
        learningGoal: formData.customLearningGoal,
        experienceLevel: formData.experienceLevel,
        learningStyle: formData.learningStyle,
        timeCommitment: formData.timeCommitment,
      });

      console.log("Course created successfully:", courseId);
      
      // Redirect to home after successful course creation
      router.push("/home");
    } catch (error) {
      console.error("Failed to create course:", error);
      alert(
        `Failed to create course: ${error instanceof Error ? error.message : String(error)}`,
      );
      setIsSubmitting(false);
    }
  };

  const canProceed = (() => {
    if (currentStep === 1) {
      return formData.customLearningGoal.trim().length > 0;
    }
    if (currentStep < 4) {
      return getCurrentSelection() !== null;
    }
    const finalStepValidation =
      formData.customLearningGoal.trim().length > 0 &&
      formData.experienceLevel !== null &&
      formData.learningStyle !== null &&
      formData.timeCommitment !== null;

    return finalStepValidation;
  })();

  const nextStep = () => {
    const lastStep = steps[steps.length - 1];
    if (currentStep < lastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getDisplayQuestion = (question: string) => {
    if (currentStep === 2) {
      const selectedSubject =
        formData.customLearningGoal.trim().length > 0
          ? formData.customLearningGoal
          : "this subject";
      return question.replace("[selected subject]", selectedSubject);
    }
    return question;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed right-4 top-4 z-50">
        <Link href="/home">
          <Button variant="ghost" size="icon" aria-label="Close and go home">
            <X className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      {/* Stepper Indicator */}
      <div className="bg-white px-6 pt-4">
        <div className="mx-auto max-w-lg">
          <Stepper value={currentStep} onValueChange={() => {}}>
            {[1, 2, 3, 4, 5].map((step) => (
              <StepperItem key={step} step={step} className="flex-1">
                <StepperTrigger
                  className="w-full flex-col items-start gap-2"
                  asChild
                >
                  <StepperIndicator
                    asChild
                    className="h-2 w-full rounded-none bg-border"
                  >
                    <span className="sr-only">{step}</span>
                  </StepperIndicator>
                </StepperTrigger>
              </StepperItem>
            ))}
          </Stepper>
          {/* <div className="text-muted-foreground text-sm font-medium tabular-nums text-center mt-2">
            Step {currentStep} of {steps.length}
          </div> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 pb-24">
        <div className="w-full max-w-lg">
          {(() => {
            const stepInfo = getCurrentStepData();
            const currentSelection = getCurrentSelection();

            return (
              <>
                <div className="mb-12 text-center">
                  <div className="mb-4 flex items-center justify-center gap-2">

                    <stepInfo.icon className="h-10 w-10" />

                    <h1 className="font-semibold text-2xl text-gray-900">
                      {stepInfo.title}
                    </h1>
                  </div>
                  <div className="mx-auto max-w-md">
                    <div className="relative inline-block rounded-2xl border bg-gray-50 p-4 text-left">
                      <p className="text-base text-gray-800 leading-relaxed">
                        {getDisplayQuestion(stepInfo.question)}
                      </p>
                      <div className="-translate-y-1 absolute top-full left-6 h-3 w-3 rotate-45 border-r border-b bg-gray-50" />
                    </div>
                  </div>
                </div>
                {currentStep > 0 && (
                  <div className="mb-16 space-y-3">
                    {currentStep === 3 ? (
                      <div className="flex gap-4">
                        {stepInfo.options.map((option) => (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => updateFormData(option.id)}
                            className={`${currentSelection === option.id
                                ? "border-2 border-blue-500"
                                : "border border-gray-300 hover:border-gray-200"} flex-1 rounded-lg bg-white p-4 transition-all active:border-b-1 active:translate-y-1`}
                          >
                            {option.image && (
                              <Image
                                src={option.image}
                                alt={option.label}
                                width={100}
                                height={100}
                                className="mb-4 h-40 w-full rounded-lg object-contain bg-gray-50 p-2"
                              />)
                            }
                            <div className="font-semibold text-gray-900">
                              {option.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      stepInfo.options.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => updateFormData(option.id)}
                          className={`flex w-full cursor-pointer items-center gap-4 rounded-lg border p-5 text-left transition-all ${currentSelection === option.id
                              ? "border-b-4 border-blue-500 bg-white rounded-xl"
                              : "border-gray-300 border-b-4 bg-white hover:border-gray-200 hover:bg-gray-50 rounded-xl"} active:border-b-1 active:translate-y-1`}
                        >
                          <div className="flex flex-1 items-center gap-3">
                            <option.icon size={24} className="text-blue-300" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {option.label}
                              </div>
                              {option.description && (
                                <div className="text-gray-500 text-sm">
                                  ({option.description})
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    {currentStep === 1 && (
                      <div className="mt-4">
                        <Input
                          type="text"
                          placeholder="What do you want to learn?"
                          value={formData.customLearningGoal}
                          onChange={(e) =>
                            updateCustomLearningGoal(e.target.value)
                          }
                          className="h-12 w-full rounded-lg border border-gray-300 bg-white p-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed right-0 bottom-0 left-0 border-gray-200 border-t bg-white">
        <div className="mx-auto max-w-lg px-0 py-8">
          <div className="flex items-center justify-between">
            <Button
                          className="h-10 px-8"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting}
            >
              Previous
            </Button>

            <FancyButton
              onClick={currentStep === 4 ? handleSubmitProfile : nextStep}
              disabled={!canProceed || isSubmitting}
              className="h-10 px-8"
            >
              {isSubmitting
                ? "Creating Course..."
                : currentStep === 4
                  ? "Complete"
                  : "Continue"}
            </FancyButton>
          </div>
        </div>
      </div>
    </div>
  );
}