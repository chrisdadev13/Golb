import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Gets the top users by XP points for the leaderboard
 */
export const getLeaderboard = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 10;

		// Get all user progress sorted by XP
		const topUsers = await ctx.db
			.query("userProgress")
			.withIndex("by_xp")
			.order("desc")
			.take(limit);

		// Get user details for each
		const leaderboardWithUsers = await Promise.all(
			topUsers.map(async (progress) => {
				// Get user from auth
				const user = await authComponent.getAnyUserById(ctx, progress.userId);
				
				return {
					id: progress.userId,
					name: user?.name || "Anonymous",
					avatar: user?.image || `https://api.dicebear.com/9.x/notionists/svg?seed=${progress.userId}`,
					score: progress.xpPoints,
					isCurrentUser: false, // Will be set on frontend
				};
			}),
		);

		return leaderboardWithUsers;
	},
});

/**
 * Gets the current user's rank and position in the leaderboard
 */
export const getCurrentUserRank = query({
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return;
		}

		// Get current user's progress
		const userProgress = await ctx.db
			.query("userProgress")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (!userProgress) {
			return {
				rank: 0,
				total: 0,
				xp: 0,
			};
		}

		// Count how many users have more XP
		const usersWithMoreXP = await ctx.db
			.query("userProgress")
			.withIndex("by_xp")
			.order("desc")
			.filter((q) => q.gt(q.field("xpPoints"), userProgress.xpPoints))
			.collect();

		// Get total number of users
		const totalUsers = await ctx.db.query("userProgress").collect();

		return {
			rank: usersWithMoreXP.length + 1,
			total: totalUsers.length,
			xp: userProgress.xpPoints,
		};
	},
});

/**
 * Gets the current user's streak information
 */
export const getUserStreak = query({
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return;
		}

		// Get all user progress for this user (across all courses)
		const allProgress = await ctx.db
			.query("userProgress")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		if (allProgress.length === 0) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				lastActivityDate: Date.now(),
				streakDays: [],
			};
		}

		// Find the highest streak values across all courses
		const maxCurrentStreak = Math.max(...allProgress.map((p) => p.currentStreak));
		const maxLongestStreak = Math.max(...allProgress.map((p) => p.longestStreak));
		const mostRecentActivity = Math.max(...allProgress.map((p) => p.lastActivityDate));

		// Generate streak days: today + next 4 days (forward-looking)
		const today = new Date();
		const streakDays = [];
		const dayLabels = ["Su", "M", "T", "W", "Th", "F", "Sa"];

		for (let i = 0; i < 5; i++) {
			const date = new Date(today);
			date.setDate(date.getDate() + i);
			const dayStart = new Date(date).setHours(0, 0, 0, 0);
			const dayEnd = new Date(date).setHours(23, 59, 59, 999);

			// Check if user had any activity on this day (only relevant for today)
			const hasActivity = allProgress.some(
				(p) => p.lastActivityDate >= dayStart && p.lastActivityDate <= dayEnd,
			);

			streakDays.push({
				label: dayLabels[date.getDay()],
				day: date.toLocaleDateString("en-US", { weekday: "long" }),
				isActive: hasActivity,
			});
		}

		return {
			currentStreak: maxCurrentStreak,
			longestStreak: maxLongestStreak,
			lastActivityDate: mostRecentActivity,
			streakDays,
		};
	},
});