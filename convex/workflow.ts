import { createOpenAI } from "@ai-sdk/openai";
import { WorkflowManager } from "@convex-dev/workflow";
import { generateObject, generateText } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import {
	GenerateBlocksSystemPrompt,
	GenerateCourseDescriptionSystemPrompt,
	GenerateCourseMetadataSystemPrompt,
	GenerateLevelsSystemPrompt,
	GenerateSectionsSystemPrompt,
} from "../ai/prompts";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
	internalAction,
	internalMutation,
	internalQuery,
} from "./_generated/server";

// ============================================================================
// Type Definitions
// ============================================================================

type QuestionType = "select" | "multiselect" | "text" | "sort";
type BlockType = "content" | "question";
type CourseStatus = "generating" | "ready" | "failed";
type SectionStatus = "no_content" | "generating" | "in_progress" | "completed";

interface CourseInfo {
	title: string;
	learningGoal: string;
	experienceLevel: string;
	timeCommitment: string;
}

interface LevelData {
	title: string;
	order: number;
	description: string;
}

interface CourseContext {
	subject: string;
	experienceLevel: string;
}

export const workflow = new WorkflowManager(components.workflow);

export const generateCourseWorkflow = workflow.define({
	args: {
		courseId: v.id("courses"),
		subject: v.string(),
		learningGoal: v.string(),
		experienceLevel: v.string(),
		timeCommitment: v.string(),
	},
	handler: async (step, args): Promise<string> => {
		try {
			// Step 1: Generate enhanced course description and summary
			const courseInfo = mapToCourseInfo(args);
			const courseContent = await step.runAction(
				internal.workflow.generateCourseContentAction,
				{ courseInfo },
			);

			// Update course with enhanced description and summary
			await step.runMutation(internal.workflow.updateCourseContent, {
				courseId: args.courseId,
				description: courseContent.description,
				summary: courseContent.summary,
			});

			// Step 2: Generate levels
			const levels = await step.runAction(
				internal.workflow.generateLevelsAction,
				{ courseInfo },
			);

			// Step 3: Save levels to database
			const levelIds: Id<"levels">[] = [];
			for (const level of levels) {
				const levelId = await step.runMutation(internal.workflow.createLevel, {
					courseId: args.courseId,
					...level,
				});
				levelIds.push(levelId);
			}

			// Step 4: Generate and save sections for all levels
			let firstSectionId: Id<"sections"> | null = null;
			const courseContext: CourseContext = {
				subject: args.subject,
				experienceLevel: args.experienceLevel,
			};

			for (const levelId of levelIds) {
				const level = await step.runQuery(internal.workflow.getLevelById, {
					levelId,
				});

				if (!level) continue;

				const sections = await step.runAction(
					internal.workflow.generateSectionsAction,
					{
						level: {
							title: level.title,
							order: level.order,
							description: level.description,
						},
						courseContext,
					},
				);

				for (const section of sections) {
					const sectionId = await step.runMutation(
						internal.workflow.createSection,
						{ levelId, ...section },
					);

					// Keep track of the first section ID from the first level
					if (firstSectionId === null && levelId === levelIds[0]) {
						firstSectionId = sectionId;
					}
				}
			}

			// Step 5: Generate blocks for the first section only
			if (firstSectionId) {
				const firstSection = await step.runQuery(
					internal.workflow.getSectionById,
					{ sectionId: firstSectionId },
				);

				if (firstSection) {
					await step.runMutation(internal.workflow.updateSectionStatus, {
						sectionId: firstSectionId,
						status: toSectionStatus("in_progress"),
					});

					const blocks = await step.runAction(
						internal.workflow.generateBlocksAction,
						{
							section: {
								title: firstSection.title,
								description: firstSection.description,
							},
							courseContext,
						},
					);

					// Save blocks to database
					for (const block of blocks) {
						await step.runMutation(internal.workflow.createBlock, {
							sectionId: firstSectionId,
							type: toBlockType(block.type),
							content: block.content,
							order: block.order,
							questionType: toQuestionType(block.questionType),
							options: block.options,
							correctAnswer: block.correctAnswer,
							hint: block.hint,
							explanation: block.explanation,
							sources: block.sources,
						});
					}
					// Logic to Generate Video

					const summarizedBlocks = await Promise.all(blocks.map((block) => summarizeBlock(block.content)));
					
					const payload = {
						title: firstSection.title,
						subject: args.subject,
						blocks: summarizedBlocks,
					}

					const { r2_filename } = await generateVideoCourse(payload);

					await step.runMutation(internal.workflow.updateSectionVideoUrl, {
						sectionId: firstSectionId,
						videoUrl: `https://pub-a20860b4624741878bf5736392e03d84.r2.dev/chris-bridge/${r2_filename}`,
					});
				}
			}

			// Step 6: Generate course metadata (topics, prerequisites, next steps)
			const courseMetadata = await step.runAction(
				internal.workflow.generateCourseMetadataAction,
				{ courseInfo, levels },
			);

			// Update course with metadata
			await step.runMutation(internal.workflow.updateCourseMetadata, {
				courseId: args.courseId,
				...courseMetadata,
			});

			// Step 7: Update course status to ready
			await step.runMutation(internal.workflow.updateCourseStatus, {
				courseId: args.courseId,
				status: toCourseStatus("ready"),
			});

			return "Course generation completed successfully";
		} catch (error) {
			// Mark course as failed if there's an error
			await step.runMutation(internal.workflow.updateCourseStatus, {
				courseId: args.courseId,
				status: toCourseStatus("failed"),
			});
			throw error;
		}
	},
});

// ============================================================================
// Internal Actions
// ============================================================================

/**
 * Generates enhanced course description and summary
 */
export const generateCourseContentAction = internalAction({
	args: {
		courseInfo: v.object({
			title: v.string(),
			learningGoal: v.string(),
			experienceLevel: v.string(),
			timeCommitment: v.string(),
		}),
	},
	handler: async (_, args) => {
		return await generateCourseContent(args.courseInfo);
	},
});

/**
 * Generates course levels based on course information
 */
export const generateLevelsAction = internalAction({
	args: {
		courseInfo: v.object({
			title: v.string(),
			learningGoal: v.string(),
			experienceLevel: v.string(),
			timeCommitment: v.string(),
		}),
	},
	handler: async (_, args) => {
		return await generateLevels(args.courseInfo);
	},
});

/**
 * Generates sections for a specific level
 */
export const generateSectionsAction = internalAction({
	args: {
		level: v.object({
			title: v.string(),
			order: v.number(),
			description: v.string(),
		}),
		courseContext: v.object({
			subject: v.string(),
			experienceLevel: v.string(),
		}),
	},
	handler: async (_, args) => {
		return await generateSections(args.level, args.courseContext);
	},
});

/**
 * Generates course metadata including topics, prerequisites, and next steps
 */
export const generateCourseMetadataAction = internalAction({
	args: {
		courseInfo: v.object({
			title: v.string(),
			learningGoal: v.string(),
			experienceLevel: v.string(),
			timeCommitment: v.string(),
		}),
		levels: v.array(
			v.object({
				title: v.string(),
				order: v.number(),
				description: v.string(),
			}),
		),
	},
	handler: async (_, args) => {
		return await generateCourseMetadata(args.courseInfo, args.levels);
	},
});

export const generateBlocksWorkflow = workflow.define({
	args: {
		sectionId: v.id("sections"),
	},
	handler: async (step, args) => {
		try {
			// Get the section
			const section = await step.runQuery(internal.workflow.getSectionById, {
				sectionId: args.sectionId,
			});

			if (!section) {
				throw new Error("Section not found");
			}

			// Get the course context
			const course = await step.runQuery(internal.workflow.getCourseBySectionId, {
				sectionId: args.sectionId,
			});

			if (!course) {
				throw new Error("Course not found");
			}

			// Generate blocks for the section
			const courseContext: CourseContext = {
				subject: course.title,
				experienceLevel: "intermediate", // Default to intermediate
			};

			const blocks = await step.runAction(
				internal.workflow.generateBlocksAction,
				{
					section: {
						title: section.title,
						description: section.description,
					},
					courseContext,
				},
			);

			// Save blocks to database
			for (const block of blocks) {
				await step.runMutation(internal.workflow.createBlock, {
					sectionId: args.sectionId,
					type: toBlockType(block.type),
					content: block.content,
					order: block.order,
					questionType: toQuestionType(block.questionType),
					options: block.options,
					correctAnswer: block.correctAnswer,
					hint: block.hint,
					explanation: block.explanation,
					sources: block.sources,
				});
			}

			// Update section status to in_progress when generation is complete
			await step.runMutation(internal.workflow.updateSectionStatus, {
				sectionId: args.sectionId,
				status: toSectionStatus("in_progress"),
			});
		} catch (error) {
			// Reset section status if generation fails
			await step.runMutation(internal.workflow.updateSectionStatus, {
				sectionId: args.sectionId,
				status: toSectionStatus("in_progress"), // Reset to in_progress to allow retry
			});
			throw error;
		}
	},
});

/**
 * Generates learning blocks for a section
 */
export const generateBlocksAction = internalAction({
	args: {
		section: v.object({
			title: v.string(),
			description: v.string(),
		}),
		courseContext: v.object({
			subject: v.string(),
			experienceLevel: v.string(),
		}),
	},
	handler: async (_, args) => {
		return await generateBlocks(args.section, args.courseContext);
	},
});

// ============================================================================
// Internal Mutations
// ============================================================================

/**
 * Creates a new level in the database
 */
export const createLevel = internalMutation({
	args: {
		courseId: v.id("courses"),
		title: v.string(),
		order: v.number(),
		description: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the course to get the userId
		const course = await ctx.db.get(args.courseId);
		if (!course) {
			throw new Error("Course not found");
		}

		const levelId = await ctx.db.insert("levels", {
			title: args.title,
			order: args.order,
			description: args.description,
			courseId: args.courseId,
			userId: course.userId,
		});

		// Update the course to include this level
		// await ctx.db.patch(args.courseId, {
		// 	levels: [...course.levels, levelId],
		// });

		return levelId;
	},
});

/**
 * Creates a new section in the database
 */
export const createSection = internalMutation({
	args: {
		levelId: v.id("levels"),
		title: v.string(),
		order: v.number(),
		description: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the level to get the userId
		const level = await ctx.db.get(args.levelId);
		if (!level) {
			throw new Error("Level not found");
		}

		const sectionId = await ctx.db.insert("sections", {
			title: args.title,
			order: args.order,
			description: args.description,
			levelId: args.levelId,
			userId: level.userId,
			status: "no_content",
		});

		return sectionId;
	},
});

// ============================================================================
// Internal Queries
// ============================================================================

/**
 * Retrieves a level by its ID
 */
export const getLevelById = internalQuery({
	args: { levelId: v.id("levels") },
	handler: async (ctx, args) => {
		const level = await ctx.db.get(args.levelId);
		return level;
	},
});

/**
 * Retrieves all sections for a given level
 */
export const getSectionsByLevel = internalQuery({
	args: { levelId: v.id("levels") },
	handler: async (ctx, args) => {
		const sections = await ctx.db
			.query("sections")
			.withIndex("by_level_order", (q) => q.eq("levelId", args.levelId))
			.collect();
		return sections;
	},
});

/**
 * Retrieves a section by its ID
 */
export const getSectionById = internalQuery({
	args: { sectionId: v.id("sections") },
	handler: async (ctx, args) => {
		const section = await ctx.db.get(args.sectionId);
		return section;
	},
});

/**
 * Retrieves a course by its ID
 */
export const getCourseById = internalQuery({
	args: { courseId: v.id("courses") },
	handler: async (ctx, args) => {
		const course = await ctx.db.get(args.courseId);
		return course;
	},
});

/**
 * Retrieves a course by a section ID
 */
export const getCourseBySectionId = internalQuery({
	args: { sectionId: v.id("sections") },
	handler: async (ctx, args) => {
		const section = await ctx.db.get(args.sectionId);
		if (!section) {
			return null;
		}

		const level = await ctx.db.get(section.levelId);
		if (!level) {
			return null;
		}

		const course = await ctx.db.get(level.courseId);
		return course;
	},
});

/**
 * Updates the status of a section
 */
export const updateSectionStatus = internalMutation({
	args: {
		sectionId: v.id("sections"),
		status: v.union(v.literal("no_content"), v.literal("generating"), v.literal("in_progress"), v.literal("completed")),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.sectionId, {
			status: args.status,
		});
	},
});

/**
 * Updates the video URL of a section
 */
export const updateSectionVideoUrl = internalMutation({
	args: {
		sectionId: v.id("sections"),
		videoUrl: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.sectionId, {
			videoUrl: args.videoUrl,
		});
	},
});

/**
 * Creates a new block in the database
 */
export const createBlock = internalMutation({
	args: {
		sectionId: v.id("sections"),
		type: v.union(v.literal("content"), v.literal("question")),
		content: v.string(),
		order: v.number(),
		questionType: v.optional(
			v.union(
				v.literal("select"),
				v.literal("multiselect"),
				v.literal("text"),
				v.literal("sort"),
			),
		),
		options: v.optional(v.array(v.string())),
		correctAnswer: v.optional(v.string()),
		hint: v.optional(v.string()),
		explanation: v.optional(v.string()),
		sources: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		// Get the section to get the userId
		const section = await ctx.db.get(args.sectionId);
		if (!section) {
			throw new Error("Section not found");
		}

		const blockId = await ctx.db.insert("blocks", {
			sectionId: args.sectionId,
			type: args.type,
			content: args.content,
			order: args.order,
			userId: section.userId,
			questionType: args.questionType,
			options: args.options,
			correctAnswer: args.correctAnswer,
			hint: args.hint,
			explanation: args.explanation,
			sources: args.sources,
		});

		return blockId;
	},
});

/**
 * Updates course description and summary
 */
export const updateCourseContent = internalMutation({
	args: {
		courseId: v.id("courses"),
		description: v.string(),
		summary: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.courseId, {
			description: args.description,
			summary: args.summary,
		});
		return args.courseId;
	},
});

/**
 * Updates course metadata (topics, prerequisites, next steps)
 */
export const updateCourseMetadata = internalMutation({
	args: {
		courseId: v.id("courses"),
		topics: v.array(v.string()),
		prerequisites: v.array(v.string()),
		nextSteps: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.courseId, {
			topics: args.topics,
			prerequisites: args.prerequisites,
			nextSteps: args.nextSteps,
		});
		return args.courseId;
	},
});

/**
 * Updates the status of a course
 */
export const updateCourseStatus = internalMutation({
	args: {
		courseId: v.id("courses"),
		status: v.union(
			v.literal("generating"),
			v.literal("ready"),
			v.literal("failed"),
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.courseId, {
			status: args.status,
		});
		return args.courseId;
	},
});

// ============================================================================
// OpenAI Configuration
// ============================================================================

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY as string,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps workflow args to CourseInfo object
 */
function mapToCourseInfo(args: {
	subject: string;
	learningGoal: string;
	experienceLevel: string;
	timeCommitment: string;
}): CourseInfo {
	return {
		title: args.subject,
		learningGoal: args.learningGoal,
		experienceLevel: args.experienceLevel,
		timeCommitment: args.timeCommitment,
	};
}

/**
 * Safely casts block type to the expected union type
 */
function toBlockType(type: string): BlockType {
	return type as BlockType;
}

/**
 * Safely casts question type to the expected union type
 */
function toQuestionType(type?: string): QuestionType | undefined {
	return type as QuestionType | undefined;
}

/**
 * Safely casts course status to the expected union type
 */
function toCourseStatus(status: string): CourseStatus {
	return status as CourseStatus;
}

/**
 * Safely casts section status to the expected union type
 */
function toSectionStatus(status: string): SectionStatus {
	return status as SectionStatus;
}

// ============================================================================
// AI Generation Functions
// ============================================================================

/**
 * Generates enhanced course description and summary using AI
 */
async function generateCourseContent(courseInfo: CourseInfo) {
	const { title, learningGoal, experienceLevel, timeCommitment } = courseInfo;
	const { object } = await generateObject({
		model: openai("gpt-4o"),
		system: GenerateCourseDescriptionSystemPrompt,
		temperature: 0.1,
		prompt: `
        Course Title: ${title}
        Learning Goal: ${learningGoal}
        Experience Level: ${experienceLevel}
        Time Commitment: ${timeCommitment}
        
        Generate both a compelling summary (2-3 sentences) and a detailed description for this course.
        The summary should be concise and engaging, while the description should be comprehensive and detailed.
        <summary_rules>
          The SUMMARY SHOULD BE: 
            Characters: 150 
            Words: 30 
            Sentences: 2 
            Paragraphs: 1 
            Spaces: 30
        </summary_rules>
        `,
		schema: z.object({
			summary: z
				.string()
				.describe("A concise and engaging summary of the course."),
			description: z
				.string()
				.describe("A comprehensive engaging description of the course."),
		}),
	});
	return object;
}

/**
 * Generates course metadata including topics, prerequisites, and next steps
 */
async function generateCourseMetadata(
	courseInfo: CourseInfo,
	levels: LevelData[],
) {
	const { object } = await generateObject({
		model: openai("gpt-4o"),
		system: GenerateCourseMetadataSystemPrompt,
		temperature: 0.1,
		prompt: `
    Course Title: ${courseInfo.title}
    Learning Goal: ${courseInfo.learningGoal}
    Experience Level: ${courseInfo.experienceLevel}
    Time Commitment: ${courseInfo.timeCommitment}
    
    Levels:
    ${levels.map((level) => `- ${level.title}: ${level.description}`).join("\n")}
    
    Generate comprehensive course metadata including topics, prerequisites, and next steps.
    `,
		schema: z.object({
			topics: z
				.array(z.string())
				.describe("5-8 key topics covered in this course."),
			prerequisites: z
				.array(z.string())
				.describe(
					"3-5 foundational knowledge areas students should know before taking this course.",
				),
			nextSteps: z
				.array(z.string())
				.describe(
					"3-4 advanced courses that would logically follow this course.",
				),
		}),
	});
	return object;
}

/**
 * Generates course levels using AI based on course information
 */
async function generateLevels(courseInfo: CourseInfo) {
	const { title: subject, learningGoal, experienceLevel, timeCommitment } =
		courseInfo;
	const { object } = await generateObject({
		model: openai("gpt-4o"),
		system: GenerateLevelsSystemPrompt,
		temperature: 0.1,
		prompt: `
        Subject: ${subject}
        Learning Goal: ${learningGoal}
        Experience Level: ${experienceLevel}
        Time Commitment: ${timeCommitment}
        `,
		schema: z.object({
			levels: z.array(
				z.object({
					title: z.string().describe("A concise title for the level."),
					order: z.number().describe("The order of the level in the course."),
					description: z
						.string()
						.describe("A comprehensive description of the level."),
				}),
			),
		}),
	});
	return object.levels;
}

/**
 * Generates sections for a level using AI
 */
async function generateSections(
	level: LevelData,
	courseContext: CourseContext,
) {
	const { object } = await generateObject({
		model: openai("gpt-4o"),
		system: GenerateSectionsSystemPrompt,
		temperature: 0.1,
		prompt: `
        Course Subject: ${courseContext.subject}
        Experience Level: ${courseContext.experienceLevel}
        
        Level: ${level.title}
        Level Description: ${level.description}
        Level Order: ${level.order}
        
        Generate sections for this specific level.
        `,
		schema: z.object({
			sections: z.array(
				z.object({
					title: z.string().describe("An engaging title for the section."),
					order: z.number().describe("The order of the section in the level."),
					description: z
						.string()
						.describe("A comprehensive description of the section."),
				}),
			),
		}),
	});
	return object.sections;
}

/**
 * Generates learning blocks for a section using AI with web search
 */
async function generateBlocks(
	section: { title: string; description: string },
	courseContext: CourseContext,
) {
	const { text, sources } = await generateText({
		model: openai.responses("gpt-4o-mini"),
		system: `
		You are an expert educational content researcher with deep knowledge of how students learn and what makes content engaging and effective.
		You will be given a section title and description and you need to search the web for up-to-date information.
		You will then return the information in markdown format.
		KEEP THE INFORMATION SHORT AND TO THE POINT.
		`,
		prompt: `
		Section Title: ${section.title}
		Section Description: ${section.description}
		Course Subject: ${courseContext.subject}
		Experience Level: ${courseContext.experienceLevel}
		`,
		temperature: 0.1,
		toolChoice: "required",
		tools: {
			web_search_preview: openai.tools.webSearch(),
		},
	});

	const { object } = await generateObject({
		model: openai("gpt-4o"),
		system: GenerateBlocksSystemPrompt,
		temperature: 0.1,
		maxOutputTokens: 10000,
		prompt: `
      Section Title: ${section.title}
      Section Description: ${section.description}
      Course Subject: ${courseContext.subject}
      Experience Level: ${courseContext.experienceLevel}
      
      Web Search Results:
      ${text}
	  Sources:
	  ${sources}
    `,
		schema: z.object({
			blocks: z.array(
				z.object({
					type: z.enum(["content", "question"]),
					content: z.string(),
					order: z.number(),
					questionType: z.optional(
						z.enum(["select", "multiselect", "text", "sort"]),
					),
					options: z.optional(z.array(z.string())),
					correctAnswer: z.optional(z.string()),
					hint: z.optional(z.string()),
					explanation: z.optional(z.string()),
					sources: z.optional(z.array(z.string())),
				}),
			),
		}),
	});
	return object.blocks;
}

// Summarize block before sending it to the API that generates video
async function summarizeBlock(block: string) {
	const { text } = await generateText({
		model: openai.responses("gpt-4o-mini"),
		system: `You are a concise technical summarizer. Summarize the given text block into 1-2 short sentences that capture only the core concept. Be extremely brief.`,
		prompt: `Summarize this in 1-2 sentences:\n\n${block}`,
		temperature: 0.1,
	});
	return text;
}

// Generate Video API

const API_KEY = process.env.API_KEY as string;

type Payload = {
	title: string;
	subject: string;
	blocks: string[]
}
async function generateVideoCourse(payload: Payload): Promise<{ r2_url: string, r2_filename: string }> {
	const response = await fetch(
		"https://chrisdadev13--manim-course-generator-fastapi-app.modal.run/generate",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-Key": API_KEY
			},
			body: JSON.stringify(payload)
		}
	);

	const data = await response.json();

	const { r2_url, r2_filename } = data as { r2_url: string, r2_filename: string };

	return { r2_url, r2_filename };
}
