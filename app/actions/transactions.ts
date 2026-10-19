"use server";

import { db } from "@/db";
import { transactions, pockets, categories } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, desc } from "drizzle-orm";
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

  const numericAmount = parseCurrencyInput(amount);
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

export async function transferPocketBalance(
  fromPocketId: string,
  toPocketId: string,
  amount: string,
  note?: string,
) {
  // validation pocket 
  if (!fromPocketId || !toPocketId) {
    return { error: "Choose both source and destination pockets."}
  }

  if (fromPocketId === toPocketId) {
    return { error: "Source and destination pocket cannot be the same."}
  }

  // validation amount
  const numericAmount = parseCurrencyInput(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: "Transfer amount must be greater than 0." };
  }

  try {
    const userId = await getUserId();

    const result = await db.transaction(async (tx) => {
      // fetch both pocket data and verify the user
      const [fromPocket] = await tx
        .select()
        .from(pockets)
        .where(and(eq(pockets.id, fromPocketId), eq(pockets.userId, userId)))
        .limit(1);

      const [toPocket]= await tx
        .select()
        .from(pockets)
        .where(and(eq(pockets.id, toPocketId), eq(pockets.userId, userId)))
        .limit(1);

      // check if pocket is found and owner is correct
      if (!fromPocket || !toPocket) {
        throw new Error("Pocket not found");
      }

      // check balance
      const fromBalance = parseFloat(fromPocket.balance);
      if (fromBalance < numericAmount) {
        throw new Error(`Insufficient balance in ${fromPocket.name}`);
      }

      // calculate new balance
      const newFromBalance = (fromBalance - numericAmount).toFixed(2);
      const newToBalance = (parseFloat(toPocket.balance) + numericAmount).toFixed(2);

      // update both pockets amount
      await tx
        .update(pockets)
        .set({ balance: newFromBalance })
        .where(eq(pockets.id, fromPocketId))

      await tx
        .update(pockets)
        .set({ balance: newToBalance })
        .where(eq(pockets.id, toPocketId))

      const outTransId = crypto.randomUUID();
      const inTransId = crypto.randomUUID();
      const cleanNote = note?.trim() ? ` (${note.trim()})` : "";

      // record the transaction history
      await tx.insert(transactions).values({
        id: outTransId,
        userId,
        pocketId: fromPocketId,
        categoryId: null,
        amount: numericAmount.toFixed(2),
        type: "expense",
        description: `Transfer to ${toPocket.name}${cleanNote}`,
        createdAt: new Date(),
      });

      // insert into destination pocket
      await tx.insert(transactions).values({
        id: inTransId,
        userId,
        pocketId: toPocketId,
        categoryId: null,
        amount: numericAmount.toFixed(2),
        type: "income",
        description: `Transfer from ${fromPocket.name}${cleanNote}`,
        createdAt: new Date(),
      });

      return {
        fromPocketId,
        newFromBalance,
        toPocketId,
        newToBalance,
        fromPocketName: fromPocket.name,
        toPocketName: toPocket.name,
        amount: numericAmount.toFixed(2),
        outTransId,
        inTransId,
        note: note?.trim() || null,
      };
    });

    // refresh cache
    revalidatePath("/dashboard");
    revalidatePath(`/pocket/${fromPocketId}`);
    revalidatePath(`/pocket/${toPocketId}`);

    return { success: true, ...result };
    
  } catch (error: any) {
    console.error("Transfer error: ", error);
    return { error: error.message || "Failed to transfer"}
  }
}
