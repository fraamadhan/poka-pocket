"use server";

import { db } from "@/db";
import { transactions, pockets, categories } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getRecentTransactions() {
  try {
    const userId = await getUserId();
    const result = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
        pocketName: pockets.name,
        categoryName: categories.name,
        categoryIcon: categories.icon,
      })
      .from(transactions)
      .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);
    return { data: result };
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return { error: error.message || "Failed to load transactions." };
  }
}

export async function createTransaction(
  amount: string,
  type: "expense" | "income",
  pocketId: string,
  categoryId: string | null,
  description: string
) {
  if (!pocketId) {
    return { error: "Pocket is required." };
  }

  const normalizedAmount = amount.replace(',', '.');
  const numericAmount = parseFloat(normalizedAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: "Amount must be a valid positive number." };
  }

  try {
    const userId = await getUserId();

    const result = await db.transaction(async (tx) => {
      // 1. Fetch pocket and verify ownership
      const [pocket] = await tx
        .select()
        .from(pockets)
        .where(and(eq(pockets.id, pocketId), eq(pockets.userId, userId)))
        .limit(1);

      if (!pocket) {
        throw new Error("Chosen pocket not found or unauthorized.");
      }

      // 2. Calculate new balance
      const currentBalance = parseFloat(pocket.balance);
      let newBalance = currentBalance;

      if (type === "expense") {
        newBalance = currentBalance - numericAmount;
      } else {
        newBalance = currentBalance + numericAmount;
      }

      // 3. Update pocket balance
      await tx
        .update(pockets)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(pockets.id, pocketId));

      // 4. Insert transaction record
      const transId = crypto.randomUUID();
      await tx.insert(transactions).values({
        id: transId,
        userId,
        pocketId,
        categoryId: categoryId || null,
        amount: numericAmount.toFixed(2),
        type,
        description: description.trim() || null,
      });

      return { transId, newBalance: newBalance.toFixed(2) };
    });

    revalidatePath("/dashboard");
    return { success: true, transId: result.transId, newBalance: result.newBalance };
  } catch (error: any) {
    console.error("Transaction error:", error);
    return { error: error.message || "Failed to process transaction." };
  }
}
