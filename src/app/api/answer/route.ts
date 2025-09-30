import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { getToken } from "#/lib/auth-server";
import { env } from "#/env";

export async function POST(request: Request) {
  try {
    // Check authentication
    const token = await getToken();
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userAnswer, correctAnswer, question } = await request.json();

    if (!userAnswer || !correctAnswer || !question) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use AI to verify if the answer is semantically correct
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `You are an answer verification assistant. Compare the user's answer with the correct answer and determine if they are semantically equivalent, even if worded differently. Be lenient with minor variations but strict with factual accuracy.`,
      prompt: `
Question: ${question}

Correct Answer: ${correctAnswer}

User's Answer: ${userAnswer}

Is the user's answer correct? Consider:
- Semantic equivalence (same meaning, different words)
- Factual accuracy
- Key concepts covered
- Minor spelling/grammar errors are acceptable
      `,
      schema: z.object({
        isCorrect: z.boolean().describe("Whether the answer is correct"),
        explanation: z
          .string()
          .describe("Brief explanation of why it's correct or incorrect"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe("Confidence score from 0 to 1"),
      }),
    });

    return NextResponse.json({
      isCorrect: object.isCorrect,
      explanation: object.explanation,
      confidence: object.confidence,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to verify answer",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}