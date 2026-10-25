"use server";

import { db } from "@/db";
import { recurringRules, pockets, categories, transactions } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, lte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseCurrencyInput } from "@/lib/currency";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export interface RecurringRuleItem {
  id: string;
  userId: string;
  pocketId: string;
  pocketName: string;
  pocketIcon: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  type: "expense" | "income";
  amount: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  nextRunDate: Date;
  lastRunDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export async function getRecurringRules(): Promise<{ data?: RecurringRuleItem[]; error?: string }> {
  try {
    const userId = await getUserId();
    const rules = await db
      .select({
        id: recurringRules.id,
        userId: recurringRules.userId,
        pocketId: recurringRules.pocketId,
        pocketName: pockets.name,
        pocketIcon: pockets.icon,
        categoryId: recurringRules.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        type: recurringRules.type,
        amount: recurringRules.amount,
        description: recurringRules.description,
        frequency: recurringRules.frequency,
        nextRunDate: recurringRules.nextRunDate,
        lastRunDate: recurringRules.lastRunDate,
        isActive: recurringRules.isActive,
        createdAt: recurringRules.createdAt,
      })
      .from(recurringRules)
      .innerJoin(pockets, eq(recurringRules.pocketId, pockets.id))
      .leftJoin(categories, eq(recurringRules.categoryId, categories.id))
      .where(eq(recurringRules.userId, userId))
      .orderBy(desc(recurringRules.createdAt));

    return { data: rules };
  } catch (error: any) {
    console.error("Failed to fetch recurring rules:", error);
    return { error: error.message || "Failed to load recurring rules." };
  }
}

export async function createRecurringRule(data: {
  pocketId: string;
  categoryId?: string | null;
  type: "expense" | "income";
  amount: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  startDate?: string;
}) {
  const { pocketId, categoryId, type, amount, description, frequency, startDate } = data;

  if (!pocketId) {
    return { error: "Please select a pocket." };
  }
  if (!description || !description.trim()) {
    return { error: "Description is required." };
  }
  const numericAmount = parseCurrencyInput(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: "Amount must be a valid number greater than 0." };
  }

  try {
    const userId = await getUserId();

    // Verify pocket ownership
    const [targetPocket] = await db
      .select()
      .from(pockets)
      .where(and(eq(pockets.id, pocketId), eq(pockets.userId, userId)))
      .limit(1);

    if (!targetPocket) {
      return { error: "Selected pocket not found." };
    }

    if (type === "expense") {
      if (targetPocket.isLocked) {
        return { error: `Pocket "${targetPocket.name}" is locked. Unlock it before creating an expense rule.` };
      }
      const pocketBalance = parseFloat(targetPocket.balance);
      if (pocketBalance < numericAmount) {
        return {
          error: `Insufficient balance in pocket "${targetPocket.name}". Available: Rp ${pocketBalance.toLocaleString("id-ID")}, Required: Rp ${numericAmount.toLocaleString("id-ID")}. Please top up the pocket first.`,
        };
      }
    }

    // Determine initial nextRunDate
    let nextRun: Date;
    if (startDate && startDate.trim()) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        return { error: "Start date format is invalid." };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parsedMidnight = new Date(parsed);
      parsedMidnight.setHours(0, 0, 0, 0);

      if (parsedMidnight < today) {
        return { error: "Start date cannot be in the past (must be today or later)." };
      }
      nextRun = parsed;
    } else {
      nextRun = new Date();
    }

    const ruleId = crypto.randomUUID();
    await db.insert(recurringRules).values({
      id: ruleId,
      userId,
      pocketId,
      categoryId: categoryId || null,
      type,
      amount: numericAmount.toFixed(2),
      description: description.trim(),
      frequency,
      nextRunDate: nextRun,
      isActive: true,
    });

    revalidatePath("/dashboard");
    return { success: true, id: ruleId };
  } catch (error: any) {
    console.error("Failed to create recurring rule:", error);
    return { error: error.message || "Failed to create recurring rule." };
  }
}

export async function toggleRecurringRule(ruleId: string, isActive: boolean) {
  try {
    const userId = await getUserId();
    await db
      .update(recurringRules)
      .set({ isActive })
      .where(and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle recurring rule:", error);
    return { error: error.message || "Failed to update rule status." };
  }
}

export async function deleteRecurringRule(ruleId: string) {
  try {
    const userId = await getUserId();
    await db
      .delete(recurringRules)
      .where(and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete recurring rule:", error);
    return { error: error.message || "Failed to delete recurring rule." };
  }
}

export async function updateRecurringRule(
  ruleId: string,
  data: {
    pocketId: string;
    categoryId?: string | null;
    type: "expense" | "income";
    amount: string;
    description: string;
    frequency: "daily" | "weekly" | "monthly";
    nextRunDate: string;
  }
) {
  try {
    const userId = await getUserId();
    const numericAmount = parseCurrencyInput(data.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { error: "Amount must be a valid positive number." };
    }

    if (!data.description.trim()) {
      return { error: "Description is required." };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsedNext = new Date(data.nextRunDate);
    const parsedNextMidnight = new Date(parsedNext);
    parsedNextMidnight.setHours(0, 0, 0, 0);

    if (parsedNextMidnight < today) {
      return { error: "Next payment date cannot be in the past (must be today or later)." };
    }

    // Verify pocket ownership and balance
    const [targetPocket] = await db
      .select()
      .from(pockets)
      .where(and(eq(pockets.id, data.pocketId), eq(pockets.userId, userId)))
      .limit(1);

    if (!targetPocket) {
      return { error: "Selected pocket not found." };
    }

    if (data.type === "expense") {
      if (targetPocket.isLocked) {
        return { error: `Pocket "${targetPocket.name}" is locked. Unlock it first.` };
      }
      const pocketBalance = parseFloat(targetPocket.balance);
      if (pocketBalance < numericAmount) {
        return {
          error: `Insufficient balance in pocket "${targetPocket.name}". Available: Rp ${pocketBalance.toLocaleString("id-ID")}, Required: Rp ${numericAmount.toLocaleString("id-ID")}. Please top up the pocket first.`,
        };
      }
    }

    await db
      .update(recurringRules)
      .set({
        pocketId: data.pocketId,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: numericAmount.toFixed(2),
        description: data.description.trim(),
        frequency: data.frequency,
        nextRunDate: parsedNext,
      })
      .where(and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update recurring rule:", error);
    return { error: error.message || "Failed to update recurring rule." };
  }
}

export async function triggerRecurringRuleNow(ruleId: string): Promise<{
  success: boolean;
  error?: string;
  nextRunDate?: string;
  newBalance?: string;
  pocketId?: string;
}> {
  try {
    const userId = await getUserId();
    const now = new Date();

    const [rule] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, ruleId), eq(recurringRules.userId, userId)))
      .limit(1);

    if (!rule) {
      return { success: false, error: "Recurring rule not found." };
    }

    const [pocket] = await db
      .select()
      .from(pockets)
      .where(and(eq(pockets.id, rule.pocketId), eq(pockets.userId, userId)))
      .limit(1);

    if (!pocket) {
      return { success: false, error: "Target pocket not found." };
    }

    if (rule.type === "expense" && pocket.isLocked) {
      return {
        success: false,
        error: `Pocket "${pocket.name}" is locked for savings. Unlock it before running an expense.`,
      };
    }

    const ruleAmount = parseFloat(rule.amount);
    const currentBalance = parseFloat(pocket.balance);

    if (rule.type === "expense" && currentBalance < ruleAmount) {
      return {
        success: false,
        error: `Insufficient balance in pocket "${pocket.name}". Required: Rp ${ruleAmount.toLocaleString("id-ID")}, Available: Rp ${currentBalance.toLocaleString("id-ID")}. Please top up first.`,
      };
    }

    const nextDate = advanceNextRunDate(now, rule.frequency);
    let updatedBalance = currentBalance;

    await db.transaction(async (tx) => {
      const newBalance =
        rule.type === "income" ? currentBalance + ruleAmount : currentBalance - ruleAmount;
      updatedBalance = newBalance;

      // Update pocket balance
      await tx
        .update(pockets)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(pockets.id, rule.pocketId));

      // Record transaction
      const transId = crypto.randomUUID();
      await tx.insert(transactions).values({
        id: transId,
        userId,
        pocketId: rule.pocketId,
        categoryId: rule.categoryId || null,
        amount: rule.amount,
        type: rule.type,
        description: `[Manual Run] ${rule.description}`,
        createdAt: now,
      });

      // Advance schedule and record lastRunDate
      await tx
        .update(recurringRules)
        .set({
          lastRunDate: now,
          nextRunDate: nextDate,
          isActive: true, // Resume if paused
        })
        .where(eq(recurringRules.id, rule.id));
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      nextRunDate: nextDate.toISOString(),
      newBalance: updatedBalance.toFixed(2),
      pocketId: rule.pocketId,
    };
  } catch (error: any) {
    console.error("Failed to run recurring rule now:", error);
    return { success: false, error: error.message || "Execution failed." };
  }
}

/**
 * Calculates the next schedule timestamp given a frequency and previous date
 */
function advanceNextRunDate(currentDate: Date, frequency: "daily" | "weekly" | "monthly"): Date {
  const next = new Date(currentDate);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }

  // If the computed next date is still in the past, advance until it's in the future
  const now = new Date();
  while (next <= now) {
    if (frequency === "daily") {
      next.setDate(next.getDate() + 1);
    } else if (frequency === "weekly") {
      next.setDate(next.getDate() + 7);
    } else if (frequency === "monthly") {
      next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
}

/**
 * Core engine to process pending recurring rules.
 * Callable both from server-side dashboard on-visit catch-up, and from the daily Vercel Cron API.
 */
export async function processPendingRecurringRules(
  targetUserId?: string,
  options?: { shouldRevalidate?: boolean }
): Promise<{
  success: boolean;
  processedCount: number;
  details: string[];
}> {
  const shouldRevalidate = options?.shouldRevalidate ?? true;
  const now = new Date();
  const details: string[] = [];
  let processedCount = 0;

  try {
    // 1. Fetch due rules
    const conditions = [
      eq(recurringRules.isActive, true),
      lte(recurringRules.nextRunDate, now),
    ];
    if (targetUserId) {
      conditions.push(eq(recurringRules.userId, targetUserId));
    }

    const dueRules = await db.query.recurringRules.findMany({
      where: and(...conditions),
    });

    if (dueRules.length === 0) {
      return { success: true, processedCount: 0, details: ["No pending recurring rules found."] };
    }

    // 2. Process each rule atomically
    for (const rule of dueRules) {
      try {
        await db.transaction(async (tx) => {
          // Fetch pocket
          const [pocket] = await tx
            .select()
            .from(pockets)
            .where(eq(pockets.id, rule.pocketId))
            .limit(1);

          if (!pocket) {
            // Pocket was deleted; deactivate rule to prevent future errors
            await tx
              .update(recurringRules)
              .set({ isActive: false })
              .where(eq(recurringRules.id, rule.id));
            details.push(`Rule ${rule.id} deactivated: pocket not found.`);
            return;
          }

          // If pocket is locked and it's an expense, skip execution for safety
          if (rule.type === "expense" && pocket.isLocked) {
            details.push(`Rule "${rule.description}" skipped: Pocket "${pocket.name}" is locked.`);
            return;
          }

          const ruleAmount = parseFloat(rule.amount);
          const currentBalance = parseFloat(pocket.balance);

          // Check for insufficient balance on recurring expense
          if (rule.type === "expense" && currentBalance < ruleAmount) {
            // Advance nextRunDate so it doesn't get stuck in an endless loop every reload
            const nextDate = advanceNextRunDate(rule.nextRunDate, rule.frequency);
            await tx
              .update(recurringRules)
              .set({
                nextRunDate: nextDate,
              })
              .where(eq(recurringRules.id, rule.id));

            details.push(
              `Rule "${rule.description}" skipped: Insufficient balance in pocket "${pocket.name}". Required: Rp ${ruleAmount.toLocaleString()}, Available: Rp ${currentBalance.toLocaleString()}.`
            );
            return;
          }

          const newBalance =
            rule.type === "income" ? currentBalance + ruleAmount : currentBalance - ruleAmount;

          // Update pocket balance
          await tx
            .update(pockets)
            .set({ balance: newBalance.toFixed(2) })
            .where(eq(pockets.id, rule.pocketId));

          // Create transaction record
          const transId = crypto.randomUUID();
          await tx.insert(transactions).values({
            id: transId,
            userId: rule.userId,
            pocketId: rule.pocketId,
            categoryId: rule.categoryId || null,
            amount: rule.amount,
            type: rule.type,
            description: `[Auto] ${rule.description}`,
            createdAt: now,
          });

          // Calculate next run date and update rule
          const nextDate = advanceNextRunDate(rule.nextRunDate, rule.frequency);
          await tx
            .update(recurringRules)
            .set({
              lastRunDate: now,
              nextRunDate: nextDate,
            })
            .where(eq(recurringRules.id, rule.id));

          processedCount++;
          details.push(`Processed rule "${rule.description}" (${rule.type} Rp ${rule.amount}). Next run: ${nextDate.toISOString()}`);
        });
      } catch (err: any) {
        console.error(`Error processing recurring rule ${rule.id}:`, err);
        details.push(`Error on rule ${rule.id}: ${err?.message || "Unknown error"}`);
      }
    }

    if (processedCount > 0 && shouldRevalidate) {
      try {
        revalidatePath("/dashboard");
      } catch (err) {
        // Safe fallback if called in a context where revalidatePath is not supported
      }
    }

    return { success: true, processedCount, details };
  } catch (error: any) {
    console.error("Failed to process recurring rules:", error);
    return { success: false, processedCount, details: [error.message || "Processing failed."] };
  }
}
