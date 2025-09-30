import { v } from "convex/values";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation, internalAction } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {
  testMode: false
});

/**
 * Sends an email notification when a course is ready
 */
export const sendCourseReadyEmail = internalMutation({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    courseTitle: v.string(),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const courseUrl = `${process.env.SITE_URL || "http://localhost:3000"}/course/${args.courseId}`;

    await resend.sendEmail(ctx, {
      from: "Suma <notifications@sumahq.com>",
      to: args.userEmail,
      subject: `🎉 Your course "${args.courseTitle}" is ready!`,
      text: `Hi ${args.userName},

Great news! Your course "${args.courseTitle}" has been generated and is ready for you to start learning.

We've created comprehensive content with interactive sections, quizzes, and everything you need to master the subject.

Start learning now:
${courseUrl}

Happy learning!
The Suma Team`,
    });
  },
});

/**
 * Sends an email notification when flashcards are ready
 */
export const sendFlashcardsReadyEmail = internalMutation({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    flashcardSetTitle: v.string(),
    flashcardSetId: v.id("flashcardSets"),
    cardCount: v.number(),
  },
  handler: async (ctx, args) => {
    const flashcardUrl = `${process.env.SITE_URL || "http://localhost:3000"}/flashcard/${args.flashcardSetId}`;

    await resend.sendEmail(ctx, {
      from: "Suma <notifications@sumahq.com>",
      to: args.userEmail,
      subject: `✨ Your flashcards "${args.flashcardSetTitle}" are ready!`,
      text: `Hi ${args.userName},

Your flashcard set "${args.flashcardSetTitle}" has been generated with ${args.cardCount} cards and is ready for you to study!

Start practicing now to improve your retention and master the material faster.

Start studying now:
${flashcardUrl}

💡 Tip: Spaced repetition is key! Review your flashcards regularly for best results.

Happy studying!
The Suma Team`,
    });
  },
});

/**
 * Helper function to send email verification (can be called from Better Auth)
 */
export async function sendVerificationEmail(
  // biome-ignore lint/suspicious/noExplicitAny: Better Auth context type compatibility
  ctx: any,
  { to, url, firstName }: { to: string; url: string; firstName?: string }
) {
  const urlWithCallback = new URL(url);
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  urlWithCallback.searchParams.set('callbackURL', `${siteUrl}/home`);

  const greeting = firstName ? `Hi ${firstName}` : "Hello";

  await resend.sendEmail(ctx, {
    from: "Suma <notifications@sumahq.com>",
    to,
    subject: "Verify your email address",
    text: `${greeting},

Thank you for signing up! Please verify your email address by clicking the link below:

${urlWithCallback.toString()}

This link will expire in 24 hours for security reasons.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Suma Team`,
  });
}

/**
 * Sends an email verification link to the user (internal action wrapper)
 */
export const sendEmailVerification = internalAction({
  args: {
    to: v.string(),
    url: v.string(),
    firstName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await sendVerificationEmail(ctx, args);
  },
});
