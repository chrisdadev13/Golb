import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { workflow } from "./workflow";

/**
 * Creates a flashcard set from uploaded file and triggers generation workflow
 */
export const createFlashcardSetFromFile = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		sourceFileId: v.id("_storage"),
		sourceFileName: v.string(),
		sourceFileType: v.string(),
		documentUrl: v.optional(v.string()), // Public URL for PDF OCR processing
		targetCount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
        const auth = await ctx.auth.getUserIdentity();
        if (!auth) return;
            
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Get the public URL for the uploaded file
		const documentUrl = await ctx.storage.getUrl(args.sourceFileId);

		// Create the flashcard set
		const flashcardSetId = await ctx.db.insert("flashcardSets", {
			userId: user._id,
			title: args.title,
			description: args.description,
			sourceType: "file",
			sourceFileId: args.sourceFileId,
			sourceFileName: args.sourceFileName,
			sourceFileType: args.sourceFileType,
			cardCount: 0, // Will be updated by workflow
			status: "processing",
		});

		// Trigger the workflow with documentUrl for OCR processing
		await workflow.start(ctx, internal.workflow.generateFlashcardWorkflow, {
			flashcardSetId,
			sourceType: "file",
			documentUrl: documentUrl || undefined,
			targetCount: args.targetCount,
		});

		return flashcardSetId;
	},
});

/**
 * Creates a flashcard set from scraped URL content and triggers generation workflow
 */
export const createFlashcardSetFromUrls = mutation({
	args: {
		title: v.string(),
		description: v.optional(v.string()),
		sourceUrls: v.array(v.string()),
		content: v.string(), // Combined scraped content from all URLs
		targetCount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
        const auth = await ctx.auth.getUserIdentity();
        if (!auth) return;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error("Not authenticated");
		}

		// Create the flashcard set
		const flashcardSetId = await ctx.db.insert("flashcardSets", {
			userId: user._id,
			title: args.title,
			description: args.description,
			sourceType: "url",
			sourceUrls: args.sourceUrls,
			cardCount: 0, // Will be updated by workflow
			status: "processing",
		});

		// Trigger the workflow
		await workflow.start(ctx, internal.workflow.generateFlashcardWorkflow, {
			flashcardSetId,
			content: args.content,
			sourceType: "url",
			targetCount: args.targetCount,
		});

		return flashcardSetId;
	},
});

/**
 * Gets all flashcard sets for the current user
 */
export const getFlashcardSets = query({
	handler: async (ctx) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) return [];

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return [];

		const flashcardSets = await ctx.db
			.query("flashcardSets")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		return flashcardSets;
	},
});

/**
 * Gets a specific flashcard set with its flashcards and user progress
 */
export const getFlashcardSetById = query({
	args: {
		flashcardSetId: v.id("flashcardSets"),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) return null;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;

		// Get the flashcard set
		const flashcardSet = await ctx.db.get(args.flashcardSetId);
		if (!flashcardSet || flashcardSet.userId !== user._id) {
			return null;
		}

		// Get all flashcards for this set
		const flashcards = await ctx.db
			.query("flashcards")
			.withIndex("by_set", (q) => q.eq("setId", args.flashcardSetId))
			.order("asc")
			.collect();

		// Get user progress for all flashcards
		const flashcardsWithProgress = await Promise.all(
			flashcards.map(async (flashcard) => {
				const progress = await ctx.db
					.query("userFlashcardProgress")
					.withIndex("by_user_and_card", (q) =>
						q.eq("userId", user._id).eq("flashcardId", flashcard._id),
					)
					.first();

				return {
					...flashcard,
					progress: progress || null,
				};
			}),
		);

		return {
			...flashcardSet,
			flashcards: flashcardsWithProgress,
		};
	},
});

/**
 * Records user's answer to a flashcard
 */
export const recordFlashcardAnswer = mutation({
	args: {
		flashcardId: v.id("flashcards"),
		userAnswer: v.string(),
		isCorrect: v.boolean(),
	},
	handler: async (ctx, args) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) return;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return;

		// Check if progress record exists
		const existingProgress = await ctx.db
			.query("userFlashcardProgress")
			.withIndex("by_user_and_card", (q) =>
				q.eq("userId", user._id).eq("flashcardId", args.flashcardId),
			)
			.first();

		const now = Date.now();

		if (existingProgress) {
			// Update existing progress
			await ctx.db.patch(existingProgress._id, {
				lastReviewedAt: now,
				correctCount: args.isCorrect
					? existingProgress.correctCount + 1
					: existingProgress.correctCount,
				incorrectCount: !args.isCorrect
					? existingProgress.incorrectCount + 1
					: existingProgress.incorrectCount,
				repetitions: existingProgress.repetitions + 1,
			});
		} else {
			// Create new progress record
			await ctx.db.insert("userFlashcardProgress", {
				userId: user._id,
				flashcardId: args.flashcardId,
				lastReviewedAt: now,
				nextReviewAt: now + 86400000, // 1 day from now
				easeFactor: 2.5,
				intervalDays: 1,
				repetitions: 1,
				correctCount: args.isCorrect ? 1 : 0,
				incorrectCount: args.isCorrect ? 0 : 1,
			});
		}
	},
});