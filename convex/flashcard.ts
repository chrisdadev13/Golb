import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";
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

		// Trigger internal action to scrape and process
		await ctx.scheduler.runAfter(0, internal.flashcard.scrapeAndGenerateFlashcards, {
			flashcardSetId,
			sourceUrls: args.sourceUrls,
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

/**
 * Gets user's flashcard statistics
 */
export const getUserFlashcardStats = query({
	handler: async (ctx) => {
		const auth = await ctx.auth.getUserIdentity();
		if (!auth) return null;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;

		// Get all user progress records
		const allProgress = await ctx.db
			.query("userFlashcardProgress")
			.filter((q) => q.eq(q.field("userId"), user._id))
			.collect();

		if (allProgress.length === 0) {
			return {
				totalCards: 0,
				correctAnswers: 0,
				incorrectAnswers: 0,
				accuracy: 0,
				mostDifficultCard: null,
			};
		}

		// Calculate stats
		const totalCorrect = allProgress.reduce((sum, p) => sum + p.correctCount, 0);
		const totalIncorrect = allProgress.reduce((sum, p) => sum + p.incorrectCount, 0);
		const totalAnswers = totalCorrect + totalIncorrect;
		const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

		// Find most difficult card (highest incorrect count)
		const mostDifficult = allProgress.reduce((max, p) => 
			p.incorrectCount > (max?.incorrectCount || 0) ? p : max
		, allProgress[0]);

		// Get the flashcard details for most difficult
		let mostDifficultCard = null;
		if (mostDifficult && mostDifficult.incorrectCount > 0) {
			const flashcard = await ctx.db.get(mostDifficult.flashcardId);
			if (flashcard) {
				mostDifficultCard = {
					question: flashcard.question,
					incorrectCount: mostDifficult.incorrectCount,
					correctCount: mostDifficult.correctCount,
				};
			}
		}

		return {
			totalCards: allProgress.length,
			correctAnswers: totalCorrect,
			incorrectAnswers: totalIncorrect,
			accuracy: Math.round(accuracy),
			mostDifficultCard,
		};
	},
});

/**
 * Internal action to scrape URLs and generate flashcards
 */
export const scrapeAndGenerateFlashcards = internalAction({
	args: {
		flashcardSetId: v.id("flashcardSets"),
		sourceUrls: v.array(v.string()),
		targetCount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		try {
			// Scrape URLs using Firecrawl
			const scrapeResult = await ctx.runAction(internal.firecrawl.scrapeUrls, {
				urls: args.sourceUrls,
			});

			// Trigger the workflow with scraped content - use workflow.start()
			await workflow.start(ctx, internal.workflow.generateFlashcardWorkflow, {
				flashcardSetId: args.flashcardSetId,
				content: scrapeResult.content,
				sourceType: "url",
				targetCount: args.targetCount,
			});
		} catch (error) {
			console.error("Error scraping and generating flashcards:", error);
			
			// Update flashcard set status to failed
			await ctx.runMutation(internal.workflow.updateFlashcardSetStatus, {
				flashcardSetId: args.flashcardSetId,
				status: "failed",
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
});