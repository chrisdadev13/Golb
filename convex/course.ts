import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { workflow } from "./workflow";
import { internal } from "./_generated/api";

export const getCourses = query({
	handler: async (ctx) => {
		const authed = await ctx.auth.getUserIdentity();
		if(!authed) return; 

		const user = await authComponent.getAuthUser(ctx);

		if (!user) {
			return;
		}

		const courses = await ctx.db
			.query("courses")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		// Enrich each course with progress information
		const coursesWithProgress = await Promise.all(
			courses.map(async (course) => {
				// Get all levels for this course
				const levels = await ctx.db
					.query("levels")
					.withIndex("by_course", (q) => q.eq("courseId", course._id))
					.collect();

				// Get all sections for these levels
				const allSections = await ctx.db
					.query("sections")
					.withIndex("by_level")
					.collect();

				const courseSections = allSections.filter((section) =>
					levels.some((level) => level._id === section.levelId)
				);

				// Count completed sections
				const completedSections = courseSections.filter(
					(section) => section.status === "completed"
				).length;

				const totalSections = courseSections.length;

				// Get user progress for last accessed time
				const userProgress = await ctx.db
					.query("userProgress")
					.withIndex("by_user_course", (q) =>
						q.eq("userId", user._id).eq("courseId", course._id)
					)
					.first();

				return {
					...course,
					progress: {
						completedSections,
						totalSections,
						lastAccessedAt: userProgress?.lastAccessedAt || course._creationTime,
					},
				};
			})
		);

		// Sort by last accessed (most recent first)
		coursesWithProgress.sort((a, b) => 
			b.progress.lastAccessedAt - a.progress.lastAccessedAt
		);

		return coursesWithProgress;
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
			return;
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
			return;
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
			return;
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

		// Update user progress stats
		const section = await ctx.db.get(args.sectionId);
		if (section) {
			const level = await ctx.db.get(section.levelId);
			if (!level) return;

			const userProgress = await ctx.db
				.query("userProgress")
				.withIndex("by_user_course", (q) =>
					q.eq("userId", user._id).eq("courseId", level.courseId),
				)
				.first();

			if (userProgress && !existingState?.isCompleted) {
				// Only update if block wasn't already completed
				const today = new Date().setHours(0, 0, 0, 0);
				const lastActivity = new Date(userProgress.lastActivityDate).setHours(0, 0, 0, 0);
				const daysSinceLastActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

				// Update streak
				let newStreak = userProgress.currentStreak;
				if (daysSinceLastActivity === 0) {
					// Same day, keep streak
					newStreak = userProgress.currentStreak;
				} else if (daysSinceLastActivity === 1) {
					// Consecutive day, increment streak
					newStreak = userProgress.currentStreak + 1;
				} else {
					// Streak broken, reset to 1
					newStreak = 1;
				}

				await ctx.db.patch(userProgress._id, {
					totalBlocksCompleted: userProgress.totalBlocksCompleted + 1,
					xpPoints: userProgress.xpPoints + 10, // +10 XP per block
					currentStreak: newStreak,
					longestStreak: Math.max(newStreak, userProgress.longestStreak),
					lastActivityDate: now,
					lastAccessedAt: now,
				});
			}
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
			return;
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

		// Update user progress stats for questions
		const section = await ctx.db.get(args.sectionId);
		if (!section) return { isCorrect };
		const level = await ctx.db.get(section.levelId);
		if (!level) return { isCorrect };

		const userProgress = await ctx.db
			.query("userProgress")
			.withIndex("by_user_course", (q) =>
				q.eq("userId", user._id).eq("courseId", level.courseId),
			)
			.first();

		if (userProgress) {
			const today = new Date().setHours(0, 0, 0, 0);
			const lastActivity = new Date(userProgress.lastActivityDate).setHours(0, 0, 0, 0);
			const daysSinceLastActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

			// Update streak
			let newStreak = userProgress.currentStreak;
			if (daysSinceLastActivity === 0) {
				// Same day, keep streak
				newStreak = userProgress.currentStreak;
			} else if (daysSinceLastActivity === 1) {
				// Consecutive day, increment streak
				newStreak = userProgress.currentStreak + 1;
			} else {
				// Streak broken, reset to 1
				newStreak = 1;
			}

			const updates: Partial<typeof userProgress> = {
				totalQuestionsAnswered: userProgress.totalQuestionsAnswered + 1,
				currentStreak: newStreak,
				longestStreak: Math.max(newStreak, userProgress.longestStreak),
				lastActivityDate: now,
				lastAccessedAt: now,
			};

			if (isCorrect && !existingState?.isCompleted) {
				// Only increment if this is a new correct answer (not already completed)
				updates.totalCorrectAnswers = userProgress.totalCorrectAnswers + 1;
				updates.totalBlocksCompleted = userProgress.totalBlocksCompleted + 1;
				updates.xpPoints = userProgress.xpPoints + 30; // +20 for correct answer + 10 for block
			}

			await ctx.db.patch(userProgress._id, updates);
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
			return;
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

export const getSectionById = query({
	args: { sectionId: v.id("sections") },
	handler: async (ctx, args) => {
		const authed = await ctx.auth.getUserIdentity();
		if (!authed) return;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return;
		}

		const section = await ctx.db.get(args.sectionId);
		return section;
	},
});

export const getBlocksBySection = query({
	args: { sectionId: v.id("sections") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return;
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


/**
 * Generates blocks for a section that has no content
 * Includes robust validation and race condition prevention
 */
export const generateBlocksForSection = mutation({
	args: {
		sectionId: v.id("sections"),
	},
	handler: async (ctx, args) => {
		// 1. Authentication check
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return;
		}

		// 2. Verify section exists
		const section = await ctx.db.get(args.sectionId);
		if (!section) {
			throw new Error("Section not found");
		}

		// 3. Check if section already has blocks (race condition check)
		const existingBlocks = await ctx.db
			.query("blocks")
			.withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
			.first();

		if (existingBlocks) {
			throw new Error("Section already has blocks. Cannot regenerate.");
		}

		// 4. Validate section status
		if (section.status === "generating") {
			throw new Error("Section is already generating content. Please wait.");
		}

		if (section.status !== "no_content") {
			throw new Error(
				`Section status is "${section.status}". Can only generate blocks for sections with "no_content" status.`,
			);
		}

		// 5. Get level and verify it exists
		const level = await ctx.db.get(section.levelId);
		if (!level) {
			throw new Error("Level not found");
		}

		// 6. Get course and verify ownership
		const course = await ctx.db.get(level.courseId);
		if (!course) {
			throw new Error("Course not found");
		}

		if (course.userId !== user._id) {
			throw new Error("Not authorized to generate blocks for this section");
		}

		// 7. Verify course is not still generating
		if (course.status === "generating") {
			throw new Error(
				"Course is still being generated. Please wait for it to complete.",
			);
		}

		// 8. Double-check no blocks exist (additional race condition prevention)
		const blockCount = await ctx.db
			.query("blocks")
			.withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
			.collect()
			.then((blocks) => blocks.length);

		if (blockCount > 0) {
			throw new Error(
				`Section already has ${blockCount} block(s). Cannot regenerate.`,
			);
		}

		// 9. Set section status to generating (atomic operation)
		await ctx.db.patch(args.sectionId, {
			status: "generating",
		});

		try {
			// 10. Trigger the workflow to generate blocks
			await workflow.start(ctx, internal.workflow.generateBlocksWorkflow, {
				sectionId: args.sectionId,
			});
		} catch (error) {
			// If workflow fails to start, revert status
			await ctx.db.patch(args.sectionId, {
				status: "no_content",
			});
			throw new Error(
				`Failed to start content generation: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			success: true,
			message: "Content generation started successfully",
			sectionId: args.sectionId,
		};
	},
});

/**
 * Gets user's courses with progress information for profile stats
 */
export const getUserCourses = query({
	handler: async (ctx) => {
		const authed = await ctx.auth.getUserIdentity();
		if (!authed) return [];

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return [];

		const courses = await ctx.db
			.query("courses")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		// Add progress information to each course
		const coursesWithProgress = await Promise.all(
			courses.map(async (course) => {
				// Get all levels for this course
				const levels = await ctx.db
					.query("levels")
					.withIndex("by_course", (q) => q.eq("courseId", course._id))
					.collect();

				// Get all sections for these levels
				const allSections = await ctx.db
					.query("sections")
					.withIndex("by_level")
					.collect();

				const courseSections = allSections.filter((section) =>
					levels.some((level) => level._id === section.levelId),
				);

				const totalSections = courseSections.length;
				const completedSections = courseSections.filter(
					(section) => section.status === "completed",
				).length;

				const isCompleted = totalSections > 0 && completedSections === totalSections;

				return {
					...course,
					progress: {
						totalSections,
						completedSections,
						isCompleted,
					},
				};
			}),
		);

		return coursesWithProgress;
	},
});