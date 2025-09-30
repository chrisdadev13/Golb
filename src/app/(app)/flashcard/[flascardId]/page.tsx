"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { FancyButton } from "#/components/ui/fancy-button";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from "#/components/ui/stepper";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function FlashcardStudyPage() {
  const params = useParams();
  const flashcardSetId = params.flascardId as Id<"flashcardSets">;

  // Fetch flashcard set with all flashcards
  const flashcardSet = useQuery(api.flashcard.getFlashcardSetById, {
    flashcardSetId,
  });

  const recordAnswer = useMutation(api.flashcard.recordFlashcardAnswer);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize to first unanswered question on mount
  useEffect(() => {
    if (!hasInitialized && flashcardSet && flashcardSet.flashcards.length > 0) {
      // Find first unanswered flashcard
      const firstUnansweredIndex = flashcardSet.flashcards.findIndex(
        (card) => !card.progress || card.progress.repetitions === 0
      );

      if (firstUnansweredIndex !== -1) {
        setCurrentCardIndex(firstUnansweredIndex);
      } else {
        // All cards have been answered, start from beginning
        setCurrentCardIndex(0);
      }

      setHasInitialized(true);
    }
  }, [flashcardSet, hasInitialized]);

  if (!flashcardSet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading flashcards...</div>
      </div>
    );
  }

  const { flashcards } = flashcardSet;
  const currentCard = flashcards[currentCardIndex];
  const totalCards = flashcards.length;

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      setSelectedAnswer("");
      setIsAnswerCorrect(null);
      setAiExplanation("");
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
      setSelectedAnswer("");
      setIsAnswerCorrect(null);
      setAiExplanation("");
    }
  };

  const checkAnswer = (userAnswer: string) => {
    const correctAnswer = currentCard.answer.toLowerCase().trim();
    const userAnswerNormalized = userAnswer.toLowerCase().trim();
    return correctAnswer === userAnswerNormalized;
  };

  const verifyTextAnswer = async (userAnswer: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer,
          correctAnswer: currentCard.answer,
          question: currentCard.question,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify answer");
      }

      const data = await response.json();
      
      if (data.error) {
        console.error("API Error:", data.error, data.details);
        throw new Error(data.details || data.error);
      }

      setIsAnswerCorrect(data.isCorrect);
      setAiExplanation(data.explanation);

      // Record the answer
      await recordAnswer({
        flashcardId: currentCard._id,
        userAnswer,
        isCorrect: data.isCorrect,
      });

      return data.isCorrect;
    } catch (error) {
      console.error("Error verifying answer:", error);
      setIsAnswerCorrect(false);
      setAiExplanation("Failed to verify answer. Please try again.");
      
      // Still record the answer as incorrect
      await recordAnswer({
        flashcardId: currentCard._id,
        userAnswer,
        isCorrect: false,
      });
      
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRevealAnswer = async () => {
    // For text questions, verify with AI first
    if (currentCard.questionType === "text" && selectedAnswer) {
      await verifyTextAnswer(selectedAnswer);
      setShowAnswer(true);
    } else {
      setShowAnswer(true);

      // If user selected an answer, check if it's correct and record it
      if (selectedAnswer) {
        const isCorrect = checkAnswer(selectedAnswer);
        setIsAnswerCorrect(isCorrect);

        // Record the answer
        await recordAnswer({
          flashcardId: currentCard._id,
          userAnswer: selectedAnswer,
          isCorrect,
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/flashcards">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 justify-center">
            <h1 className="font-semibold text-gray-900">
              {flashcardSet.title}
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {currentCardIndex + 1} / {totalCards}
          </div>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="bg-transparent px-6 pt-4">
        <div className="mx-auto max-w-4xl">
          <Stepper value={currentCardIndex + 1} onValueChange={() => {}}>
            {flashcards.map((card, index) => {
              const hasProgress = card.progress && card.progress.repetitions > 0;
              const isCorrect = card.progress && card.progress.correctCount > 0;
              
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: chill
                <StepperItem key={index} step={index + 1} className="flex-1">
                  <StepperTrigger
                    className="w-full flex-col items-start gap-2"
                    asChild
                  >
                    <StepperIndicator
                      asChild
                      className={`h-2 w-full rounded-none ${
                        hasProgress
                          ? isCorrect
                            ? "bg-green-500"
                            : "bg-red-500"
                          : "bg-border"
                      }`}
                    >
                      <span className="sr-only">{index + 1}</span>
                    </StepperIndicator>
                  </StepperTrigger>
                </StepperItem>
              );
            })}
          </Stepper>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Question Card */}
          <div className="mb-8 rounded-xl border bg-white p-8 shadow-sm">
            <div className="mb-2 text-xs font-medium text-gray-500 uppercase">
              Question {currentCardIndex + 1}
            </div>
            <h2 className="mb-6 text-xl font-medium text-gray-900">
              {currentCard.question}
            </h2>

            {/* Question Type Specific UI */}
            {currentCard.questionType === "multiple_choice" && !showAnswer && (
              <div className="space-y-3">
                {/* Parse options from question text or show placeholder */}
                <p className="text-sm text-gray-500">
                  (Multiple choice options would be parsed from question)
                </p>
              </div>
            )}

            {currentCard.questionType === "true_false" && !showAnswer && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedAnswer("true")}
                  className={`flex-1 rounded-lg border-2 p-4 text-center font-medium transition-all ${
                    selectedAnswer === "true"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  True
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnswer("false")}
                  className={`flex-1 rounded-lg border-2 p-4 text-center font-medium transition-all ${
                    selectedAnswer === "false"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  False
                </button>
              </div>
            )}

            {/* Text Answer Input */}
            {currentCard.questionType === "text" && !showAnswer && (
              <div>
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full rounded-lg border border-gray-300 p-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={4}
                />
              </div>
            )}

            {/* Answer Section */}
            {showAnswer && (
              <>
                {/* Feedback Banner */}
                {isAnswerCorrect !== null && (
                  <div
                    className={`mb-4 rounded-lg border-l-4 p-4 ${
                      isAnswerCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        isAnswerCorrect ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {isAnswerCorrect ? "✓ Correct!" : "✗ Incorrect"}
                    </div>
                    {!isAnswerCorrect && (
                      <div className="mt-1 text-sm text-red-600">
                        Your answer: {selectedAnswer}
                      </div>
                    )}
                    {aiExplanation && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>AI Feedback:</strong> {aiExplanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Correct Answer */}
                <div className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <div className="mb-1 text-xs font-semibold text-blue-700 uppercase">
                    Answer
                  </div>
                  <div className="text-gray-900">{currentCard.answer}</div>
                  {currentCard.explanation && (
                    <div className="mt-3 border-t border-blue-200 pt-3">
                      <div className="mb-1 text-xs font-semibold text-blue-700 uppercase">
                        Explanation
                      </div>
                      <div className="text-sm text-gray-700">
                        {currentCard.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Difficulty Badge */}
            {currentCard.difficulty && (
              <div className="mt-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    currentCard.difficulty === "easy"
                      ? "bg-green-100 text-green-700"
                      : currentCard.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {currentCard.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!showAnswer ? (
            <FancyButton 
              onClick={handleRevealAnswer} 
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? "Verifying Answer..." : "Show Answer"}
            </FancyButton>
          ) : (
            <div className="flex gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentCardIndex === 0}
                variant="outline"
                className="flex-1"
              >
                Previous
              </Button>
              <FancyButton
                onClick={handleNext}
                disabled={currentCardIndex === totalCards - 1}
                className="flex-1"
              >
                {currentCardIndex === totalCards - 1 ? "Finish" : "Next Card"}
              </FancyButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
