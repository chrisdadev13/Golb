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
    levels: v.array(v.id("levels")),
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

    // User progress tracking
    status: v.optional(
      v.union(
        v.literal("locked"),
        v.literal("current"),
        v.literal("completed"),
      ),
    ),
    userAnswer: v.optional(v.string()), // User's answer for questions
    isCorrect: v.optional(v.boolean()), // Whether the answer was correct
    hintUsed: v.optional(v.boolean()), // Whether user used hint
    seenAnswer: v.optional(v.boolean()), // Whether user clicked "See answer"
    completedAt: v.optional(v.number()),
  })
    .index("by_section", ["sectionId"])
    .index("by_user", ["userId"])
    .index("by_section_order", ["sectionId", "order"])
    .index("by_section_type", ["sectionId", "type"])
    .index("by_section_status", ["sectionId", "status"]),
});