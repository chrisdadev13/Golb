"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";

export function CoursePageClient() {

	const params = useParams();
	const courseId = params.courseId as Id<"courses">;

	const course = useQuery(api.course.getCourseById, { courseId });

	if (!course) {
		return <CourseLoadingSkeleton />;
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="border-gray-200 border-b bg-white">
				<div className="px-52 py-4">
					<Link
						href="/home"
						className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
					>
						<ArrowLeft size={20} />
						<span className="text-sm">Back to Home</span>
					</Link>
				</div>
			</div>
			<div className="px-52 py-8">
				<div className="grid grid-cols-3 gap-8">
					<div className="col-span-1">
						<div className="sticky top-8 rounded-lg border border-gray-200 bg-white p-6">
							<h1 className="mb-4 font-bold text-2xl text-gray-900">
								{course.title}
							</h1>
							<p className="mb-2 text-gray-600 leading-relaxed">
								{course.summary || course.description}
							</p>
							<Badge variant="outline">
								<BookOpen />
								{course.levels.length} Levels
							</Badge>
						</div>
					</div>
					<div className="col-span-2">
						{course.status === "generating" ? (
							<div className="space-y-6">
								{[1, 2, 3].map((i) => (
									<div key={i} className="rounded-lg bg-white p-6">
										<Skeleton className="mb-4 h-6 w-32" />
										<div className="space-y-3">
											<Skeleton className="h-16 w-full" />
											<Skeleton className="h-16 w-full" />
											<Skeleton className="h-16 w-full" />
										</div>
									</div>
								))}
							</div>
						) : course.levels && course.levels.length > 0 ? (
							<>
								<div className="space-y-6 border-none">
									{course.levels.map((level, levelIndex) => (
										<LevelCard
											courseId={courseId}
											key={level._id}
											level={level}
											levelIndex={levelIndex}
											allLevels={course.levels}
										/>
									))}
								</div>
								<CourseMetadata course={course} />
							</>
						) : (
							<div className="py-12 text-center">
								<BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
								<h3 className="mb-2 font-semibold text-gray-900 text-lg">
									No Content Available
								</h3>
								<p className="text-gray-600">
									This course doesn't have any levels yet.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function LevelCard({
	courseId,
	level,
	levelIndex,
	allLevels,
}: {
	courseId: Id<"courses">;
	level: { _id: Id<"levels">; title: string; description: string; sections: {
        _id: Id<"sections">;
        title: string;
        description: string;
        status?: string;
        completedAt?: number;
    }[] };
	levelIndex: number;
	allLevels: Array<{ _id: Id<"levels">; title: string; description: string; sections: {
        _id: Id<"sections">;
        title: string;
        description: string;
        status?: string;
        completedAt?: number;
    }[] }>;
}) {
	// Get the previous level's last section to check completion
	const previousLevel = levelIndex > 0 ? allLevels[levelIndex - 1] : null;
	const previousLevelLastSection = previousLevel?.sections?.[previousLevel.sections.length - 1];
	return (
		<div className="rounded-lg border-gray-200 bg-white">
			<div className="sticky top-0 z-50 mb-6 flex items-center gap-4 border-gray-200 bg-white px-6 py-4 pt-8">
				<div className="flex-shrink-0">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
						<span className="font-bold text-lg">{levelIndex + 1}</span>
					</div>
				</div>
				<div className="flex items-center">
					<h3 className="font-semibold text-gray-900 text-xl">
						{level.title}
					</h3>
				</div>
			</div>
			<div className="px-6 pb-6">
				{level.sections && level.sections.length > 0 ? (
					<div className="space-y-3">
						{level.sections.map((section, sectionIndex) => {
							// Determine if this section should be locked
							let isLocked = false;
							let isFirstAvailable = false;
							
							if (levelIndex === 0 && sectionIndex === 0) {
								// First section of first level is always unlocked and available
								isLocked = false;
								isFirstAvailable = section.status !== "completed";
							} else if (sectionIndex === 0) {
								// First section of subsequent levels - check if previous level's last section is completed
								if (previousLevelLastSection?.status === "completed") {
									isLocked = false;
									isFirstAvailable = section.status !== "completed";
								} else {
									isLocked = true;
								}
							} else {
								// Subsequent sections in same level - check if previous section is completed
								const previousSection = level.sections[sectionIndex - 1];
								if (previousSection?.status === "completed") {
									isLocked = false;
									isFirstAvailable = section.status !== "completed";
								} else {
									isLocked = true;
								}
							}
							
							return (
								<SectionItem
									key={section._id}
									courseId={courseId}
									section={section}
									isLocked={isLocked}
									isFirstAvailable={isFirstAvailable}
								/>
							);
						})}
					</div>
				) : (
					<div className="py-8 text-center text-gray-500">
						<Play className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p>No sections available yet</p>
					</div>
				)}
			</div>
		</div>
	);
}

function SectionItem({
	courseId,
	section,
	isLocked,
	isFirstAvailable,
}: {
	courseId: Id<"courses">;
	section: { _id: Id<"sections">; title: string; description: string; status?: string; completedAt?: number };
	isLocked: boolean;
	isFirstAvailable: boolean;
}) {

	const [isGeneratingContent, setIsGeneratingContent] = useState(false);
	const generateBlocks = useMutation(api.course.generateBlocksForSection);

	const handleGenerateContent = async () => {
		if (isGeneratingContent) return;
		
		setIsGeneratingContent(true);
		try {
			await generateBlocks({ sectionId: section._id });
		} catch (error) {
			alert(
				error instanceof Error 
					? error.message 
					: "Failed to generate content. Please try again."
			);
		} finally {
			setIsGeneratingContent(false);
		}
	};
	if (isLocked) {
		return (
			<div className="ml-14 flex items-center gap-4 rounded-lg p-4">
				{/* Section Icon */}
				<div className="flex-shrink-0">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
						<Lock className="h-4 w-4 text-gray-400" />
					</div>
				</div>

				{/* Section Info */}
				<div className="flex-1">
					<h4 className="mb-1 font-medium text-gray-500">{section.title}</h4>
				</div>
			</div>
		);
	}

	const isCompleted = section.status === "completed";
	const isGenerating = section.status === "generating";
	const hasNoContent = section.status === "no_content";

	// If generating, show loading state
	if (isGenerating) {
		return (
			<div className="ml-14 flex items-center gap-4 rounded-lg p-4">
				{/* Section Icon */}
				<div className="flex-shrink-0">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-gray-50">
						<div className="h-4 w-4 animate-spin rounded-full border-gray-400 border-b-2" />
					</div>
				</div>

				{/* Section Info */}
				<div className="flex-1">
					<h4 className="mb-1 font-medium text-gray-900">{section.title}</h4>
					<p className="text-sm">Generating content...</p>
				</div>
			</div>
		);
	}
	
	// If has no content, show start button that generates content
	if (hasNoContent) {
		return (
			<div className="ml-14 flex items-center gap-4 rounded-lg p-4">
				{/* Section Icon */}
				<div className="flex-shrink-0">
					<Tooltip open={!isGeneratingContent}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={handleGenerateContent}
								disabled={isGeneratingContent || isGenerating}
								className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-[#333] border-b-4 bg-[#4C4C4C] hover:bg-[#5C5C5C] active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isGeneratingContent ? (
									<div className="h-3 w-3 animate-spin rounded-full border-white border-b-2" />
								) : (
									<Play className="h-3 w-3 text-white" fill="#fff" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent className="z-0">
							<p>{isGeneratingContent ? "Starting generation..." : "Generate Content"}</p>
						</TooltipContent>
					</Tooltip>
				</div>

				{/* Section Info */}
				<div className="flex-1">
					<h4 className="mb-1 font-medium text-gray-900">{section.title}</h4>
				</div>
			</div>
		);
	}

	// If has content, show normal clickable section
	return (
		<Link
			href={`/course/${courseId}/lesson/${section._id}`}
			className={`ml-14 flex items-center gap-4 rounded-lg p-4 transition-colors ${
				isCompleted 
					? "" 
					: "hover:bg-gray-50"
			}`}
		>
			{/* Section Icon */}
			<div className="flex-shrink-0">
				{isCompleted ? (
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
						<CheckCircle className="h-4 w-4 text-white" />
					</div>
				) : isFirstAvailable ? (
					<Tooltip open={true}>
						<TooltipTrigger>
							<div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-[#333] border-b-4 bg-[#4C4C4C] hover:bg-[#5C5C5C] active:border-b-0">
								<Play className="h-3 w-3 text-white" fill="#fff" />
							</div>
						</TooltipTrigger>
						<TooltipContent className="z-0">
							<p>Start</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
						<div className="h-2 w-2 rounded-full bg-gray-400" />
					</div>
				)}
			</div>

			{/* Section Info */}
			<div className="flex-1">
				<h4 className={`mb-1 font-medium ${isCompleted ? "text-green-600" : "text-gray-900"}`}>
					{section.title}
				</h4>
			</div>
		</Link>
	);
}

function CourseMetadata({ course }: { course: { title: string; description: string; summary?: string; topics?: string[]; prerequisites?: string[]; nextSteps?: string[] } }) {
	return (
		<div className="mt-12 ml-6 rounded-lg border border-gray-200 bg-white p-8">
			<div className="mb-8">
				<h3 className="mb-4 font-bold text-gray-900 text-lg">Course description</h3>
				<p className="text-gray-700 leading-relaxed">
					{course.description}
				</p>
			</div>
			{course.topics && course.topics.length > 0 && (
				<div className="mb-8">
					<div className="mb-4 h-px bg-gray-200" />
					<h3 className="mb-4 font-bold text-gray-900 text-lg">Topics covered</h3>
					<div className="grid grid-cols-2 gap-x-8 gap-y-1">
						{course.topics.map((topic) => (
							<div key={topic} className="text-gray-700">
								{topic}
							</div>
						))}
					</div>
				</div>
			)}
			{course.prerequisites && course.prerequisites.length > 0 && (
				<div className="mb-8">
					<div className="mb-4 h-px bg-gray-200" />
					<h3 className="mb-4 font-bold text-gray-900 text-lg">Prerequisites</h3>
					<div className="space-y-2">
						{course.prerequisites.map((prerequisite) => (
							<div key={prerequisite}>
								<span className="cursor-pointer text-blue-600 hover:text-blue-800">
									{prerequisite}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
			{course.nextSteps && course.nextSteps.length > 0 && (
				<div className="mb-8">
					<div className="mb-4 h-px bg-gray-200" />
					<h3 className="mb-4 font-bold text-gray-900 text-lg">Next steps</h3>
					<div className="space-y-2">
						{course.nextSteps.map((nextStep) => (
							<div key={nextStep}>
								<span className="cursor-pointer text-blue-600 hover:text-blue-800">
									{nextStep}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function CourseLoadingSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="bg-white">
				<div className="px-52 py-4">
					<Skeleton className="h-5 w-32" />
				</div>
			</div>

			{/* Main Content */}
			<div className="px-52 py-8">
				<div className="grid grid-cols-3 gap-8">
					{/* Sidebar */}
					<div className="col-span-1">
						<div className="sticky top-8 rounded-lg border bg-white p-6">
							<Skeleton className="mb-4 h-8 w-3/4" />
							<Skeleton className="mb-2 h-4 w-full" />
							<Skeleton className="mb-2 h-4 w-full" />
							<Skeleton className="mb-4 h-4 w-2/3" />
							<Skeleton className="h-6 w-24" />
						</div>
					</div>

					{/* Main Content Area */}
					<div className="col-span-2">
						<div className="space-y-6">
							{/* Level Cards Skeleton */}
							{[1, 2, 3].map((level) => (
								<div key={level} className="rounded-lg  bg-white">
									{/* Level Header */}
									<div className="flex items-center gap-4 px-6 py-4 pt-8">
										<Skeleton className="h-10 w-10 rounded-lg" />
										<Skeleton className="h-6 w-48" />
									</div>

									{/* Sections */}
									<div className="space-y-3 px-6 pb-6">
										{[1, 2, 3, 4].map((section) => (
											<div key={section} className="ml-14 flex items-center gap-4 p-4">
												<Skeleton className="h-8 w-8 rounded-lg" />
												<Skeleton className="h-5 w-64" />
											</div>
										))}
									</div>
								</div>
							))}

							{/* Course Metadata Skeleton */}
							<div className="mt-12 ml-6 rounded-lg  bg-white p-8">
								<Skeleton className="mb-4 h-6 w-48" />
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="mb-8 h-4 w-3/4" />

								<div className="mb-4 h-px bg-gray-200" />
								<Skeleton className="mb-4 h-6 w-40" />
								<div className="grid grid-cols-2 gap-x-8 gap-y-2">
									{[1, 2, 3, 4, 5, 6].map((item) => (
										<Skeleton key={item} className="h-4 w-32" />
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}