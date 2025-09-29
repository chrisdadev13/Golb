import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    summary: v.optional(v.string()),
    status: v.union(
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    prerequisites: v.optional(v.array(v.string())),
    nextSteps: v.optional(v.array(v.string())),
    topics: v.optional(v.array(v.string())),
    userId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),
  levels: defineTable({
    title: v.string(),
    order: v.number(),
    description: v.string(),
    courseId: v.id("courses"),
    userId: v.string(),
  })
    .index("by_course", ["courseId"])
    .index("by_user", ["userId"])
    .index("by_course_order", ["courseId", "order"]),
  sections: defineTable({
    title: v.string(),
    order: v.number(),
    description: v.string(),
    levelId: v.id("levels"),
    userId: v.string(),
    videoUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("no_content"),
        v.literal("generating"),
        v.literal("in_progress"),
        v.literal("completed"),
      ),
    ),
    completedAt: v.optional(v.number()),
  })
    .index("by_level", ["levelId"])
    .index("by_user", ["userId"])
    .index("by_level_order", ["levelId", "order"]),
  blocks: defineTable({
    type: v.union(
      v.literal("introduction"),
      v.literal("content"),
      v.literal("question"),
      v.literal("reflection"),
    ),
    content: v.string(),
    order: v.number(),
    sectionId: v.id("sections"),
    userId: v.string(),
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
  })
    .index("by_section", ["sectionId"])
    .index("by_user", ["userId"])
    .index("by_section_order", ["sectionId", "order"])
    .index("by_section_type", ["sectionId", "type"]),
  userProgress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),

    // Streaks
    currentStreak: v.number(), // days
    longestStreak: v.number(),
    lastActivityDate: v.number(), // "2025-09-29"

    // Stats for leaderboard
    totalBlocksCompleted: v.number(),
    totalCorrectAnswers: v.number(),
    totalQuestionsAnswered: v.number(),
    xpPoints: v.number(), // simple: +10 per block, +20 for correct answer

    startedAt: v.number(),
    lastAccessedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_xp", ["xpPoints"]), // for leaderboard
  userBlockState: defineTable({
    userId: v.string(),
    blockId: v.id("blocks"),
    sectionId: v.id("sections"), // denormalized for faster queries

    isVisible: v.boolean(), // true = unlocked and visible
    isCompleted: v.boolean(),

    // For questions only
    userAnswer: v.optional(v.union(v.string(), v.array(v.string()))),
    isCorrect: v.optional(v.boolean()),
    hintUsed: v.optional(v.boolean()),

    viewedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user_section", ["userId", "sectionId"])
    .index("by_user_block", ["userId", "blockId"]),
});
