"use server";

import { db } from "@/db";
import { pockets } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseCurrencyInput } from "@/lib/currency";

// Helper to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getPockets() {
  try {
    const userId = await getUserId();
    let result = await db.query.pockets.findMany({
      where: eq(pockets.userId, userId),
      orderBy: (pockets, { asc }) => [asc(pockets.createdAt)],
    });

    // Safe starter pocket seeding for new users
    if (result.length === 0) {
      const defaultPocketId = crypto.randomUUID();
      await db.insert(pockets).values({
        id: defaultPocketId,
        userId,
        name: "Main Wallet",
        balance: "0.00",
        icon: "wallet",
      });
      result = await db.query.pockets.findMany({
        where: eq(pockets.userId, userId),
        orderBy: (pockets, { asc }) => [asc(pockets.createdAt)],
      });
    }

    return { data: result };
  } catch (error: any) {
    console.error("Failed to fetch pockets:", error);
    return { error: error.message || "Failed to load pockets." };
  }
}

export async function createPocket(
  name: string,
  balance: string,
  icon: string = "wallet",
  isGoal: boolean = false,
  targetAmount?: string,
  targetDate?: string | null,
  isLocked: boolean = false
) {
  if (!name || name.trim() === "") {
    return { error: "Pocket name cannot be empty." };
  }
  const numericBalance = parseCurrencyInput(balance);
  if (isNaN(numericBalance)) {
    return { error: "Invalid balance format." };
  }
  if (numericBalance < 0) {
    return { error: "Pocket balance cannot be less than 0." };
  }

  let formattedTargetAmount: string | null = null;
  let parsedTargetDate: Date | null = null;

  if (isGoal) {
    if (!targetAmount || targetAmount.trim() === "") {
      return { error: "Target amount is required for saving goal pockets." };
    }
    const numericTarget = parseCurrencyInput(targetAmount);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      return { error: "Target amount must be a valid number greater than 0." };
    }
    formattedTargetAmount = numericTarget.toFixed(2);

    if (targetDate && targetDate.trim() !== "") {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        return { error: "Target date format is invalid." };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMidnight = new Date(parsed);
      targetMidnight.setHours(0, 0, 0, 0);
      if (targetMidnight < today) {
        return { error: "Target date cannot be in the past (must be today or later)." };
      }
      parsedTargetDate = parsed;
    }
  }

  try {
    const userId = await getUserId();
    const pocketId = crypto.randomUUID();
    await db.insert(pockets).values({
      id: pocketId,
      userId,
      name: name.trim(),
      balance: numericBalance.toFixed(2),
      icon,
      isGoal: !!isGoal,
      targetAmount: isGoal ? formattedTargetAmount : null,
      targetDate: isGoal ? parsedTargetDate : null,
      isLocked: isGoal ? !!isLocked : false,
    });
    revalidatePath("/dashboard");
    return { success: true, id: pocketId };
  } catch (error: any) {
    console.error("Failed to create pocket:", error);
    return { error: error.message || "Failed to create pocket." };
  }
}

export async function updatePocket(
  id: string,
  name: string,
  balance: string,
  icon: string,
  isGoal: boolean = false,
  targetAmount?: string,
  targetDate?: string | null,
  isLocked: boolean = false
) {
  if (!id) {
    return { error: "Pocket ID is required." };
  }
  if (!name || name.trim() === "") {
    return { error: "Pocket name cannot be empty." };
  }
  const numericBalance = parseCurrencyInput(balance);
  if (isNaN(numericBalance)) {
    return { error: "Invalid balance format." };
  }
  if (numericBalance < 0) {
    return { error: "Pocket balance cannot be less than 0." };
  }

  let formattedTargetAmount: string | null = null;
  let parsedTargetDate: Date | null = null;

  if (isGoal) {
    if (!targetAmount || targetAmount.trim() === "") {
      return { error: "Target amount is required for saving goal pockets." };
    }
    const numericTarget = parseCurrencyInput(targetAmount);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      return { error: "Target amount must be a valid number greater than 0." };
    }
    formattedTargetAmount = numericTarget.toFixed(2);

    if (targetDate && targetDate.trim() !== "") {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        return { error: "Target date format is invalid." };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMidnight = new Date(parsed);
      targetMidnight.setHours(0, 0, 0, 0);
      if (targetMidnight < today) {
        return { error: "Target date cannot be in the past (must be today or later)." };
      }
      parsedTargetDate = parsed;
    }
  }

  try {
    const userId = await getUserId();
    await db
      .update(pockets)
      .set({
        name: name.trim(),
        balance: numericBalance.toFixed(2),
        icon,
        isGoal: !!isGoal,
        targetAmount: isGoal ? formattedTargetAmount : null,
        targetDate: isGoal ? parsedTargetDate : null,
        isLocked: isGoal ? !!isLocked : false,
      })
      .where(and(eq(pockets.id, id), eq(pockets.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update pocket:", error);
    return { error: error.message || "Failed to update pocket." };
  }
}

export async function deletePocket(id: string) {
  if (!id) {
    return { error: "Pocket ID is required." };
  }

  try {
    const userId = await getUserId();

    // Edge case safety: prevent deleting a locked pocket without unlocking first
    const [existing] = await db
      .select({ isLocked: pockets.isLocked, name: pockets.name })
      .from(pockets)
      .where(and(eq(pockets.id, id), eq(pockets.userId, userId)))
      .limit(1);

    if (!existing) {
      return { error: "Pocket not found." };
    }

    if (existing.isLocked) {
      return { error: `Pocket "${existing.name}" is locked. Unlock the pocket first before deleting.` };
    }

    await db
      .delete(pockets)
      .where(and(eq(pockets.id, id), eq(pockets.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete pocket:", error);
    return { error: error.message || "Failed to delete pocket." };
  }
}
