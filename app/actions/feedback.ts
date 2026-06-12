"use server";

import { db } from "@/db";
import { feedbacks } from "@/db/schema";
import { auth } from "@/auth";

export async function submitFeedback(rating: number | null, message: string) {
  if (!message || message.trim() === "") {
    return { error: "Feedback message cannot be empty." };
  }

  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    await db.insert(feedbacks).values({
      id: crypto.randomUUID(),
      userId,
      rating,
      message: message.trim(),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return { error: "Failed to send feedback. Please try again." };
  }
}
