import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Gets user settings, returns default values if not found
 */
export const getUserSettings = query({
	handler: async (ctx) => {
		const authed = await ctx.auth.getUserIdentity();
		if (!authed) return null;

		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;

		const settings = await ctx.db
			.query("userSettings")
			.filter((q) => q.eq(q.field("userId"), user._id))
			.first();

		// Return default settings if none exist
		if (!settings) {
			return {
				userId: user._id,
				notifyWhenCourseIsReady: true,
				notifyWhenFlashcardSetIsReady: true,
				sendDailyProblems: true,
			};
		}

		return settings;
	},
});

/**
 * Updates or creates user settings
 */
export const updateUserSettings = mutation({
	args: {
		notifyWhenCourseIsReady: v.boolean(),
		notifyWhenFlashcardSetIsReady: v.boolean(),
		sendDailyProblems: v.boolean(),
	},
	handler: async (ctx, args) => {
		const authed = await ctx.auth.getUserIdentity();
		if (!authed) throw new Error("Not authenticated");

		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("User not found");

		// Check if settings already exist
		const existingSettings = await ctx.db
			.query("userSettings")
			.filter((q) => q.eq(q.field("userId"), user._id))
			.first();

		if (existingSettings) {
			// Update existing settings
			await ctx.db.patch(existingSettings._id, {
				notifyWhenCourseIsReady: args.notifyWhenCourseIsReady,
				notifyWhenFlashcardSetIsReady: args.notifyWhenFlashcardSetIsReady,
				sendDailyProblems: args.sendDailyProblems,
			});
		} else {
			// Create new settings
			await ctx.db.insert("userSettings", {
				userId: user._id,
				notifyWhenCourseIsReady: args.notifyWhenCourseIsReady,
				notifyWhenFlashcardSetIsReady: args.notifyWhenFlashcardSetIsReady,
				sendDailyProblems: args.sendDailyProblems,
			});
		}

		return { success: true };
	},
});
