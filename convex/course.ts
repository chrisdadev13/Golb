import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { workflow } from "./workflow";
import { internal } from "./_generated/api";

export const getCourses = query({
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);

		if (!user) {
			return;
		}

		return await ctx.db
			.query("courses")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();
	},
});

export const createCourse = mutation({
	args: {
		title: v.string(),
		description: v.string(),
		learningGoal: v.string(),
		experienceLevel: v.string(),
		learningStyle: v.string(),
		timeCommitment: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const courseId = await ctx.db.insert("courses", {
			title: args.title,
			description: args.description,
			status: "generating",
			// levels: [],
			userId: user._id,
		});

		await ctx.db.insert("userProgress", {
			userId: user._id,
			courseId,
			currentStreak: 0,
			longestStreak: 0,
			lastActivityDate: Date.now(),
			totalBlocksCompleted: 0,
			totalCorrectAnswers: 0,
			totalQuestionsAnswered: 0,
			xpPoints: 0,
			startedAt: Date.now(),
			lastAccessedAt: Date.now(),
		})

		await workflow.start(ctx, internal.workflow.generateCourseWorkflow, {
			courseId,
			subject: args.title,
			learningGoal: args.learningGoal,
			experienceLevel: args.experienceLevel,
			timeCommitment: args.timeCommitment,
		});

		return courseId;
	},
});

export const getCourseById = query({
	args: { courseId: v.id("courses") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		const course = await ctx.db.get(args.courseId);

		if (!course) {
			return;
		}

		if (course.userId !== user._id) {
			return;
		}

		const levels = await ctx.db
			.query("levels")
			.withIndex("by_course", (q) => q.eq("courseId", args.courseId))
			.order("asc")
			.collect();

		const sections = await ctx.db
			.query("sections")
			.withIndex("by_level")
			.collect();

		return {
			...course,
			levels: levels.map((level) => ({
				...level,
				sections: sections.filter((section) => section.levelId === level._id),
			})),
		};
	},
});

/**
 * Gets blocks for a section with user progress
 * Returns blocks up to and including the first incomplete block
 * If no progress exists, returns only the first block
 */
/**
 * Marks a content block as completed and makes the next block visible
 */
export const completeContentBlock = mutation({
	args: {
		blockId: v.id("blocks"),
		sectionId: v.id("sections"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Get or create user block state for this block
		const existingState = await ctx.db
			.query("userBlockState")
			.withIndex("by_user_block", (q) =>
				q.eq("userId", user._id).eq("blockId", args.blockId),
			)
			.first();

		const now = Date.now();

		if (existingState) {
			// Update existing state
			await ctx.db.patch(existingState._id, {
				isCompleted: true,
				completedAt: now,
			});
		} else {
			// Create new state
			await ctx.db.insert("userBlockState", {
				userId: user._id,
				blockId: args.blockId,
				sectionId: args.sectionId,
				isVisible: true,
				isCompleted: true,
				viewedAt: now,
				completedAt: now,
			});
		}

		// Get all blocks in this section to find the next one
		const allBlocks = await ctx.db
			.query("blocks")
			.withIndex("by_section_order", (q) => q.eq("sectionId", args.sectionId))
			.order("asc")
			.collect();

		const currentBlock = await ctx.db.get(args.blockId);
		if (!currentBlock) return;

		// Find the next block
		const currentIndex = allBlocks.findIndex((b) => b._id === args.blockId);
		const nextBlock = allBlocks[currentIndex + 1];

		// If there's a next block, make it visible
		if (nextBlock) {
			const nextBlockState = await ctx.db
				.query("userBlockState")
				.withIndex("by_user_block", (q) =>
					q.eq("userId", user._id).eq("blockId", nextBlock._id),
				)
				.first();

			if (nextBlockState) {
				await ctx.db.patch(nextBlockState._id, {
					isVisible: true,
				});
			} else {
				await ctx.db.insert("userBlockState", {
					userId: user._id,
					blockId: nextBlock._id,
					sectionId: args.sectionId,
					isVisible: true,
					isCompleted: false,
					viewedAt: now,
				});
			}
		}
	},
});

/**
 * Submits an answer to a question block and marks it as completed if correct
 */
export const submitQuestionAnswer = mutation({
	args: {
		blockId: v.id("blocks"),
		sectionId: v.id("sections"),
		userAnswer: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Get the block to check the correct answer
		const block = await ctx.db.get(args.blockId);
		if (!block) {
			throw new Error("Block not found");
		}

		// Check if answer is correct
		const isCorrect =
			block.questionType === "multiselect"
				? normalizeMultiselectAnswer(args.userAnswer) ===
					normalizeMultiselectAnswer(block.correctAnswer)
				: args.userAnswer === block.correctAnswer;

		// Get or create user block state
		const existingState = await ctx.db
			.query("userBlockState")
			.withIndex("by_user_block", (q) =>
				q.eq("userId", user._id).eq("blockId", args.blockId),
			)
			.first();

		const now = Date.now();

		if (existingState) {
			// Update existing state
			await ctx.db.patch(existingState._id, {
				userAnswer: args.userAnswer,
				isCorrect,
				isCompleted: isCorrect, // Only mark as completed if correct
				completedAt: isCorrect ? now : existingState.completedAt,
			});
		} else {
			// Create new state
			await ctx.db.insert("userBlockState", {
				userId: user._id,
				blockId: args.blockId,
				sectionId: args.sectionId,
				isVisible: true,
				isCompleted: isCorrect,
				userAnswer: args.userAnswer,
				isCorrect,
				viewedAt: now,
				completedAt: isCorrect ? now : undefined,
			});
		}

		// If correct, make next block visible
		if (isCorrect) {
			const allBlocks = await ctx.db
				.query("blocks")
				.withIndex("by_section_order", (q) =>
					q.eq("sectionId", args.sectionId),
				)
				.order("asc")
				.collect();

			const currentIndex = allBlocks.findIndex((b) => b._id === args.blockId);
			const nextBlock = allBlocks[currentIndex + 1];

			if (nextBlock) {
				const nextBlockState = await ctx.db
					.query("userBlockState")
					.withIndex("by_user_block", (q) =>
						q.eq("userId", user._id).eq("blockId", nextBlock._id),
					)
					.first();

				if (nextBlockState) {
					await ctx.db.patch(nextBlockState._id, {
						isVisible: true,
					});
				} else {
					await ctx.db.insert("userBlockState", {
						userId: user._id,
						blockId: nextBlock._id,
						sectionId: args.sectionId,
						isVisible: true,
						isCompleted: false,
						viewedAt: now,
					});
				}
			}
		}

		return { isCorrect };
	},
});

/**
 * Marks a section as completed
 */
export const markSectionCompleted = mutation({
	args: {
		sectionId: v.id("sections"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Update section status
		await ctx.db.patch(args.sectionId, {
			status: "completed",
			completedAt: Date.now(),
		});
	},
});

// Helper function to normalize multiselect answers
function normalizeMultiselectAnswer(answer: string | undefined): string {
	if (!answer) return "";
	return answer
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.sort()
		.join(",");
}

export const getBlocksBySection = query({
	args: { sectionId: v.id("sections") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Get all blocks for this section, ordered
		const blocks = await ctx.db
			.query("blocks")
			.withIndex("by_section_order", (q) => q.eq("sectionId", args.sectionId))
			.order("asc")
			.collect();

		if (blocks.length === 0) {
			return [];
		}

		// Get user progress for all blocks in this section
		const userBlockStates = await ctx.db
			.query("userBlockState")
			.withIndex("by_user_section", (q) =>
				q.eq("userId", user._id).eq("sectionId", args.sectionId),
			)
			.collect();

		// Create a map of blockId -> userBlockState for quick lookup
		const progressMap = new Map(
			userBlockStates.map((state) => [state.blockId, state]),
		);

		// If user has no progress at all, return only the first block
		if (userBlockStates.length === 0) {
			const firstBlock = blocks[0];
			return [
				{
					...firstBlock,
					status: null,
					userAnswer: null,
					isCorrect: null,
					hintUsed: false,
					seenAnswer: false,
					completedAt: null,
					isLastBlockInSection: blocks.length === 1, // true only if there's only one block
				},
			];
		}

		// Find the first incomplete block
		const firstIncompleteIndex = blocks.findIndex((block) => {
			const progress = progressMap.get(block._id);
			return !progress || !progress.isCompleted;
		});

		// Determine which blocks to return
		let blocksToReturn: typeof blocks;
		if (firstIncompleteIndex === -1) {
			// All blocks are completed, return all
			blocksToReturn = blocks;
		} else {
			// Return blocks up to and including the first incomplete
			blocksToReturn = blocks.slice(0, firstIncompleteIndex + 1);
		}

		// Map blocks with their progress data and include metadata
		const enrichedBlocks = blocksToReturn.map((block) => {
			const progress = progressMap.get(block._id);

			return {
				...block,
				status: progress?.isCompleted ? "completed" : progress?.isVisible ? "current" : null,
				userAnswer: progress?.userAnswer || null,
				isCorrect: progress?.isCorrect ?? null,
				hintUsed: progress?.hintUsed || false,
				seenAnswer: progress?.isCompleted && !progress?.isCorrect && progress?.userAnswer === undefined,
				completedAt: progress?.completedAt || null,
				// Add metadata to know if this is truly the last block in the section
				isLastBlockInSection: block.order === blocks[blocks.length - 1].order,
			};
		});

		return enrichedBlocks;
	},
});