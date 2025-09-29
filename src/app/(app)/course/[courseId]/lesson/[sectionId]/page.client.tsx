"use client";

import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, BookOpen, Key, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "#/components/markdown-renderer";
import { FancyButton } from "#/components/ui/fancy-button";
import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperTrigger,
} from "#/components/ui/stepper";
import UserMenu from "#/components/user-menu";
import { Button } from "#/components/ui/button";

export default function LearnSectionPage() {
	const params = useParams();
	const router = useRouter();
	const sectionId = params.sectionId as Id<"sections">;
	const courseId = params.courseId as Id<"courses">;

	// Fetch blocks data from Convex with user progress
	const blocks = useQuery(api.course.getBlocksBySection, { sectionId });

	// Mutations
	const completeContentBlock = useMutation(api.course.completeContentBlock);
	const submitQuestionAnswer = useMutation(api.course.submitQuestionAnswer);
	const markSectionCompleted = useMutation(api.course.markSectionCompleted);

	const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
	const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
	const [showIncorrectBanner, setShowIncorrectBanner] = useState(false);
	const [shouldScrollToNext, setShouldScrollToNext] = useState(false);

	const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
	const prevBlocksLengthRef = useRef<number>(0);

	// Initialize refs array
	useEffect(() => {
		if (blocks) {
			blockRefs.current = blockRefs.current.slice(0, blocks.length);
		}
	}, [blocks]);

	// Initialize state from blocks data
	useEffect(() => {
		if (!blocks || blocks.length === 0) return;

		// Restore user answers from blocks
		blocks.forEach((block) => {
			if (block.userAnswer) {
				const answer = typeof block.userAnswer === "string" 
					? block.userAnswer 
					: Array.isArray(block.userAnswer) 
						? block.userAnswer.join(",") 
						: "";
				setSelectedAnswers((prev) => ({
					...prev,
					[block._id]: answer,
				}));
			}
		});

		// Set current block to first incomplete block
		const firstIncompleteIndex = blocks.findIndex(
			(block) => block.status !== "completed",
		);

		if (firstIncompleteIndex !== -1) {
			setCurrentBlockIndex(firstIncompleteIndex);
		} else {
			// All blocks are completed, set to last block
			setCurrentBlockIndex(blocks.length - 1);
		}
	}, [blocks]);

	// Auto-scroll when new blocks are added
	useEffect(() => {
		if (!blocks) return;

		// Check if blocks array grew (new block unlocked)
		const blocksGrew = blocks.length > prevBlocksLengthRef.current;
		
		if (blocksGrew && shouldScrollToNext) {
			// New block has been added to DOM, scroll to the last block (newest one)
			const lastBlockIndex = blocks.length - 1;
			
			setTimeout(() => {
				if (blockRefs.current[lastBlockIndex]) {
					blockRefs.current[lastBlockIndex]?.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}
			}, 150);
			
			// Reset the flag
			setShouldScrollToNext(false);
		}

		// Update the previous length
		prevBlocksLengthRef.current = blocks.length;
	}, [blocks, shouldScrollToNext]);

	const handleAnswerSelect = (blockId: string, answer: string) => {
		setSelectedAnswers((prev) => ({ ...prev, [blockId]: answer }));
		// Hide incorrect banner when user changes answer
		setShowIncorrectBanner(false);
	};

	const handleTryAgain = () => {
		if (!currentBlock) return;
		// Clear the selected answer and hide banner
		setSelectedAnswers((prev) => ({ ...prev, [currentBlock._id]: "" }));
		setShowIncorrectBanner(false);
	};

	const handleSeeAnswer = async () => {
		if (!currentBlock) return;
		
		try {
			// Mark block as completed (user saw answer)
			await completeContentBlock({
				blockId: currentBlock._id,
				sectionId,
			});

			// Hide banner
			setShowIncorrectBanner(false);

			// Prepare to scroll to next block when it appears
			if (blocks && currentBlockIndex < blocks.length - 1) {
				setShouldScrollToNext(true);
			} else if (isLastBlock) {
				// If it's the last block, complete section
				await markSectionCompleted({ sectionId });
				router.push(`/course/${courseId}`);
			}
		} catch (error) {
			console.error("Error handling see answer:", error);
		}
	};

	const handleButtonClick = async () => {
		if (!currentBlock) return;

		try {
			if (isQuestion) {
				// Handle question - submit answer
				const userAnswer = selectedAnswers[currentBlock._id];
				if (!userAnswer) return;

				const result = await submitQuestionAnswer({
					blockId: currentBlock._id,
					sectionId,
					userAnswer,
				});

				// Show banner if incorrect, otherwise continue
				if (!result.isCorrect) {
					setShowIncorrectBanner(true);
					return;
				}
				
				// If correct, prepare to scroll to next block when it appears
				setShouldScrollToNext(true);
			} else if (isLastBlock) {
				// Handle last block - complete section
				await completeContentBlock({
					blockId: currentBlock._id,
					sectionId,
				});
				await markSectionCompleted({ sectionId });
				
				// Navigate back to course page
				router.push(`/course/${courseId}`);
			} else {
				// Handle content block - mark as complete and move to next
				await completeContentBlock({
					blockId: currentBlock._id,
					sectionId,
				});

				// Prepare to scroll to next block when it appears
				setShouldScrollToNext(true);
			}
		} catch (error) {
			console.error("Error handling button click:", error);
		}
	};

	// Track which block is currently in view
	useEffect(() => {
		if (!blocks || blocks.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const index = blockRefs.current.indexOf(
							entry?.target as HTMLDivElement,
						);
						if (index !== -1) {
							// Only advance current block index forward
							setCurrentBlockIndex((prev) => Math.max(prev, index));
						}
					}
				});
			},
			{
				threshold: 0.5,
				rootMargin: "-20% 0px -20% 0px",
			},
		);

		blockRefs.current.forEach((ref) => {
			if (ref) observer.observe(ref as Element);
		});

		return () => observer.disconnect();
	}, [blocks]); // Recreate observer when blocks change

	// Show loading state
	if (!blocks) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white">
				<div className="text-center">
					<BookOpen className="mx-auto mb-4 h-12 w-12 animate-pulse text-gray-400" />
					<h1 className="mb-4 font-bold text-2xl text-gray-900">
						Loading content...
					</h1>
				</div>
			</div>
		);
	}

	// Calculate progress
	const completedBlocks = blocks.filter((block) => block.status === "completed");
	const currentBlock =
		blocks && currentBlockIndex >= 0 && currentBlockIndex < blocks.length
			? blocks[currentBlockIndex]
			: null;
	const isQuestion = currentBlock ? currentBlock.type === "question" : false;
	const hasAnswer = currentBlock
		? Boolean(
				selectedAnswers[currentBlock._id] &&
					selectedAnswers[currentBlock._id].trim(),
			)
		: false;
	// Use the isLastBlockInSection flag from the query instead of checking array length
	const isLastBlock = currentBlock ? currentBlock.isLastBlockInSection : false;

	return (
		<div className="min-h-screen bg-white">
			{/* Header with Progress */}
			<LearnHeader
				currentStep={completedBlocks.length}
				totalSteps={blocks.length}
				creditsLeft={12}
				streak={1}
			/>

			{/* Main Content - Render All Visible Blocks */}
			<div className="mx-auto max-w-3xl px-6 py-8">
				<div className="space-y-16 last:pb-32">
					{blocks.map((block, index) => {
						return (
							<div
								key={block._id}
								ref={(el) => {
									blockRefs.current[index] = el;
								}}
								className="scroll-mt-24"
							>
								{block.type === "content" ||
								block.type === "introduction" ||
								block.type === "reflection" ? (
									<div className="rounded-lg bg-white px-8">
										<MarkdownRenderer content={block.content} />
									</div>
								) : (
									<div className="rounded-lg bg-white px-8 py-16">
										<div className="mb-6">
											<h3 className="mb-4 font-semibold text-gray-900 text-xl">
												Question:
											</h3>
											<MarkdownRenderer content={block.content} />
										</div>

										{/* Question Options */}
										{(block.questionType === "select" ||
											block.questionType === "multiselect") &&
											block.options && (
												<div className="mb-6 space-y-3">
													{block.options.map((option, optionIndex) => {
														const isSelected =
															block.questionType === "multiselect"
																? selectedAnswers[block._id]
																		?.split(",")
																		.map((item) => item.trim())
																		.includes(option) || false
																: selectedAnswers[block._id] === option;

														const isCorrectAnswer =
															block.questionType === "multiselect"
																? block.correctAnswer
																		?.split(",")
																		.map((item) => item.trim())
																		.includes(option) || false
																: option === block.correctAnswer;

														const isCompleted = block.status === "completed";

														// Color logic for completed blocks
														let optionColor = "";
														if (isCompleted) {
															if (isCorrectAnswer) {
																optionColor = "border-green-300 bg-green-50 border-b-4";
															} else if (isSelected) {
																optionColor = "border-red-300 bg-red-50 border-b-4";
															}
														} else if (isSelected) {
															// Selected but not completed - blue border
															optionColor = "border-blue-500 border-b-4 bg-white";
														}

														const baseClasses =
															"flex cursor-pointer items-center rounded-lg border p-4 transition-all active:border-b-2 active:translate-y-0.5";
														const defaultClasses =
															"border-gray-300 border-b-4 hover:border-gray-200 hover:bg-gray-50";
														const finalClasses = `${baseClasses} ${optionColor || defaultClasses}`;

														return (
															<label
																key={`option-${block._id}-${optionIndex}`}
																className={finalClasses}
															>
																<input
																	type={
																		block.questionType === "multiselect"
																			? "checkbox"
																			: "radio"
																	}
																	name={`question-${block._id}`}
																	value={option}
																	checked={isSelected}
																	disabled={isCompleted}
																	onChange={(e) => {
																		if (block.questionType === "multiselect") {
																			const currentAnswers =
																				selectedAnswers[block._id]
																					?.split(",")
																					.map((item) => item.trim())
																					.filter(Boolean) || [];
																			const newAnswers = e.target.checked
																				? [...currentAnswers, option]
																				: currentAnswers.filter(
																						(ans) => ans.trim() !== option,
																					);
																			handleAnswerSelect(
																				block._id,
																				newAnswers.join(","),
																			);
																		} else {
																			handleAnswerSelect(
																				block._id,
																				e.target.value,
																			);
																		}
																	}}
																	className="mr-3 text-gray-900"
																/>
																<MarkdownRenderer content={option} />
															</label>
														);
													})}
												</div>
											)}

										{/* Text Input */}
										{block.questionType === "text" && (
											<div className="mb-6">
												<input
													type="text"
													placeholder="Your answer..."
													value={selectedAnswers[block._id] || ""}
													onChange={(e) =>
														handleAnswerSelect(block._id, e.target.value)
													}
													disabled={block.status === "completed"}
													className={`w-full rounded-lg border px-4 py-3 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 ${
														block.status === "completed"
															? block.isCorrect
																? "border-green-300 bg-green-50"
																: "border-red-300 bg-red-50"
															: "border-gray-300"
													}`}
												/>
											</div>
										)}

										{/* Show correct answer for completed questions */}
										{block.status === "completed" && block.correctAnswer && (
											<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
												<p className="mb-2 font-medium text-gray-900">
													Correct Answer:
												</p>
												<p className="text-gray-700">
													{block.questionType === "multiselect"
														? block.correctAnswer
																.split(",")
																.map((item) => item.trim())
																.join(", ")
														: block.correctAnswer}
												</p>
												{block.explanation && (
													<div className="mt-3">
														<p className="mb-2 font-medium text-gray-900">
															Explanation:
														</p>
														<div className="text-gray-700">
															<MarkdownRenderer content={block.explanation} />
														</div>
													</div>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Fixed Footer Navigation - Hide when showing incorrect banner */}
			{currentBlock && !showIncorrectBanner && (
				<div className="fixed right-0 bottom-0 left-0 border-gray-200 border-t bg-white">
					<div className="mx-auto max-w-lg px-0 py-8">
						<div className="flex items-center justify-end">
							<FancyButton
								type="button"
								onClick={handleButtonClick}
								disabled={isQuestion ? !hasAnswer : false}
								className="h-10 rounded-lg px-8 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isLastBlock ? "Complete" : isQuestion ? "Check" : "Next"}
							</FancyButton>
						</div>
					</div>
				</div>
			)}

			{/* Incorrect Answer Banner */}
			{showIncorrectBanner && currentBlock && (
				<div className="fixed right-0 bottom-0 left-0 p-6">
					<div className="mx-auto max-w-lg rounded-lg border bg-[#FFDFE1] p-6">
						<div className="relative">
							<p className="mb-4 font-semibold text-[#EA2C2B]">That's incorrect. Try again.</p>
							<div className="flex gap-3">
								<FancyButton
									type="button"
									onClick={handleTryAgain}
									className="h-10 rounded-full bg-gray-900 px-6 text-white hover:bg-gray-800"
								>
									Try again
								</FancyButton>
								<Button
									type="button"
                                    className="hover:bg-transparent"
									onClick={handleSeeAnswer}
									variant="ghost"
								>
									See answer
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface LearnHeaderProps {
	currentStep: number;
	totalSteps: number;
	creditsLeft: number;
	streak: number;
}

export function LearnHeader({
	currentStep,
	totalSteps,
	creditsLeft,
	streak,
}: LearnHeaderProps) {
	return (
		<header className="sticky top-0 z-50 border-gray-200 border-b bg-white/95 backdrop-blur-sm">
			<div className="mx-auto max-w-full px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Left side - Back Button */}
					<div className="flex items-center gap-8">
						<Link
							href="/home"
							className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
						>
							<ArrowLeft size={20} />
							<span className="text-sm">Back to home</span>
						</Link>
					</div>

					{/* Center - Progress Stepper */}
					<div className="mx-8 max-w-md flex-1">
						<Stepper value={currentStep} onValueChange={() => {}}>
							{Array.from({ length: totalSteps }, (_, index) => (
								<StepperItem
									key={`progress-step-${currentStep}-${
										// biome-ignore lint/suspicious/noArrayIndexKey: no worries
										index
									}`}
									step={index + 1}
									className="flex-1"
								>
									<StepperTrigger
										className="w-full flex-col items-start gap-2"
										asChild
									>
										<StepperIndicator
											asChild
											className={`h-2 w-full rounded-none transition-all duration-300 ${
												index < currentStep
													? "bg-green-500"
													: index === currentStep - 1
														? "bg-blue-500"
														: "bg-gray-200"
											}`}
										>
											<span className="sr-only">{index + 1}</span>
										</StepperIndicator>
									</StepperTrigger>
								</StepperItem>
							))}
						</Stepper>
					</div>

					{/* Right side - Credits, Streak, and User Menu */}
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1">
							<span className="font-medium text-black">{creditsLeft}</span>
							<Key size={14} className="text-yellow-500" />
						</div>
						<div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1">
							<span className="font-medium text-black">{streak}</span>
							<Zap size={14} className="text-gray-400" />
						</div>
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
