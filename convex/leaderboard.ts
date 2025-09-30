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

		// Get all user progress records
		const allProgress = await ctx.db.query("userProgress").collect();

		// Aggregate XP by userId
		const userXpMap = new Map<string, number>();
		for (const progress of allProgress) {
			const currentXp = userXpMap.get(progress.userId) || 0;
			userXpMap.set(progress.userId, currentXp + progress.xpPoints);
		}

		// Convert to array and sort by total XP
		const sortedUsers = Array.from(userXpMap.entries())
			.map(([userId, totalXp]) => ({ userId, totalXp }))
			.sort((a, b) => b.totalXp - a.totalXp)
			.slice(0, limit);

		// Get user details for each
		const leaderboardWithUsers = await Promise.all(
			sortedUsers.map(async ({ userId, totalXp }) => {
				// Get user from auth
				const user = await authComponent.getAnyUserById(ctx, userId);
				
				return {
					id: userId,
					name: user?.name || "Anonymous",
					avatar: user?.image || `https://api.dicebear.com/9.x/notionists/svg?seed=${userId}`,
					score: totalXp,
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
		const authed = await ctx.auth.getUserIdentity();
		if(!authed) return; 

		const user = await authComponent.getAuthUser(ctx);

		if (!user) {
			return;
		}

		// Get all user progress records
		const allProgress = await ctx.db.query("userProgress").collect();

		// Aggregate XP by userId
		const userXpMap = new Map<string, number>();
		for (const progress of allProgress) {
			const currentXp = userXpMap.get(progress.userId) || 0;
			userXpMap.set(progress.userId, currentXp + progress.xpPoints);
		}

		// Get current user's total XP
		const currentUserXp = userXpMap.get(user._id) || 0;

		if (currentUserXp === 0) {
			return {
				rank: 0,
				total: userXpMap.size,
				xp: 0,
			};
		}

		// Count how many users have more XP
		const usersWithMoreXP = Array.from(userXpMap.values()).filter(
			(xp) => xp > currentUserXp
		).length;

		return {
			rank: usersWithMoreXP + 1,
			total: userXpMap.size,
			xp: currentUserXp,
		};
	},
});

/**
 * Gets the current user's streak information
 */
export const getUserStreak = query({
	handler: async (ctx) => {
		const authed = await ctx.auth.getUserIdentity();

		if(!authed) return; 

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