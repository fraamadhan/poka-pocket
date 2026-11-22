"use server";

import { db } from "@/db";
import { transactions, pockets, categories } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, desc, asc, sql, isNotNull, isNull, gte, lte } from "drizzle-orm";
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

export interface RecentTransactionsFilters {
  filter?: "all" | "day" | "week" | "this_month" | "month" | "3months" | "6months" | "year" | "custom";
  startDate?: string;
  endDate?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function getRecentTransactions(filters: RecentTransactionsFilters = {}) {
  try {
    const userId = await getUserId();
    const {
      filter = "all",
      startDate,
      endDate,
      category = "all",
      page = 1,
      pageSize = 5,
    } = filters;

    const conditions = [eq(transactions.userId, userId)];

    if (filter === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(transactions.createdAt, start));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(transactions.createdAt, end));
      }
    } else if (filter === "this_month") {
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(transactions.createdAt, currentMonthStart));
    } else if (filter && filter !== "all") {
      const dateLimit = new Date();
      if (filter === "day") {
        dateLimit.setDate(dateLimit.getDate() - 1);
      } else if (filter === "week") {
        dateLimit.setDate(dateLimit.getDate() - 7);
      } else if (filter === "month") {
        dateLimit.setMonth(dateLimit.getMonth() - 1);
      } else if (filter === "3months") {
        dateLimit.setMonth(dateLimit.getMonth() - 3);
      } else if (filter === "6months") {
        dateLimit.setMonth(dateLimit.getMonth() - 6);
      } else if (filter === "year") {
        dateLimit.setFullYear(dateLimit.getFullYear() - 1);
      }
      conditions.push(gte(transactions.createdAt, dateLimit));
    }

    if (category === "transfers") {
      conditions.push(isNull(transactions.categoryId));
    } else if (category && category !== "all") {
      conditions.push(eq(categories.name, category));
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count || 0;
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * pageSize;

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
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      data: result,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
      currentPage: safePage,
    };
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    return {
      data: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      error: error.message || "Failed to load transactions.",
    };
  }
}

export async function getPocketTransactions(pocketId: string, page: number = 1, limit: number = 15) {
  try {
    const userId = await getUserId();
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.pocketId, pocketId)));

    const total = Number(countResult?.count || 0);

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
      .where(and(eq(transactions.userId, userId), eq(transactions.pocketId, pocketId)))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit) || 1;

    return { data: result, total, totalPages, page, limit };
  } catch (error: any) {
    console.error("Failed to fetch pocket transactions:", error);
    return { data: [], total: 0, totalPages: 1, page: 1, limit, error: error.message || "Failed to load pocket transactions." };
  }
}

export async function getCurrentMonthCategorySpent() {
  try {
    const userId = await getUserId();
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        categoryName: categories.name,
        totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          isNotNull(transactions.categoryId), // Transfers are excluded because category is null
          gte(transactions.createdAt, currentMonthStart)
        )
      )
      .groupBy(categories.name);

    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.categoryName) {
        map[r.categoryName] = Number(r.totalSpent) || 0;
      }
    }
    return { data: map };
  } catch (error: any) {
    console.error("Failed to fetch current month category spent:", error);
    return { data: {}, error: error.message || "Failed to load category spent." };
  }
}

export interface AnalyticsFilters {
  filterTime?: "day" | "week" | "this_month" | "month" | "year" | "custom" | "all";
  startDate?: string;
  endDate?: string;
  filterPocket?: string;
  filterCategory?: string;
  filterType?: "all" | "expense" | "income";
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpense: number;
  categorySpentMap: Record<string, number>;
  manaPoints: { date: string; balance: number }[];
}

export async function getAnalyticsData(filters: AnalyticsFilters = {}) {
  try {
    const userId = await getUserId();
    const {
      filterTime = "month",
      startDate,
      endDate,
      filterPocket = "all",
      filterCategory = "all",
      filterType = "all",
    } = filters;

    const conditions = [eq(transactions.userId, userId)];

    // 1. Time Filter
    if (filterTime === "custom") {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(transactions.createdAt, start));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(transactions.createdAt, end));
      }
    } else if (filterTime === "this_month") {
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      conditions.push(gte(transactions.createdAt, currentMonthStart));
    } else if (filterTime && filterTime !== "all") {
      const dateLimit = new Date();
      if (filterTime === "day") {
        dateLimit.setDate(dateLimit.getDate() - 1);
      } else if (filterTime === "week") {
        dateLimit.setDate(dateLimit.getDate() - 7);
      } else if (filterTime === "month") {
        dateLimit.setMonth(dateLimit.getMonth() - 1);
      } else if (filterTime === "year") {
        dateLimit.setFullYear(dateLimit.getFullYear() - 1);
      }
      conditions.push(gte(transactions.createdAt, dateLimit));
    }

    // 2. Pocket Filter
    if (filterPocket && filterPocket !== "all") {
      conditions.push(eq(pockets.name, filterPocket));
    }

    // 3. Category Filter
    if (filterCategory && filterCategory !== "all") {
      conditions.push(eq(categories.name, filterCategory));
    }

    // Total Income - EXCLUDE transfers (where categoryId is null)
    let totalIncome = 0;
    if (filterType === "all" || filterType === "income") {
      const incConditions = [
        ...conditions,
        eq(transactions.type, "income"),
        isNotNull(transactions.categoryId), // EXCLUDES pocket-to-pocket transfers!
      ];
      const [incRow] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
        })
        .from(transactions)
        .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...incConditions));

      totalIncome = Number(incRow?.total) || 0;
    }

    // Total Expense - EXCLUDE transfers (where categoryId is null)
    let totalExpense = 0;
    if (filterType === "all" || filterType === "expense") {
      const expConditions = [
        ...conditions,
        eq(transactions.type, "expense"),
        isNotNull(transactions.categoryId), // EXCLUDES pocket-to-pocket transfers!
      ];
      const [expRow] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
        })
        .from(transactions)
        .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...expConditions));

      totalExpense = Number(expRow?.total) || 0;
    }

    // Category Spending Breakdown (only for expenses with valid category)
    const catSpentRows = await db
      .select({
        categoryName: categories.name,
        spent: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)::float`,
      })
      .from(transactions)
      .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          ...conditions,
          eq(transactions.type, "expense"),
          isNotNull(transactions.categoryId)
        )
      )
      .groupBy(categories.name);

    const categorySpentMap: Record<string, number> = {};
    for (const r of catSpentRows) {
      if (r.categoryName) {
        categorySpentMap[r.categoryName] = Number(r.spent) || 0;
      }
    }

    // Mana Points (Balance Trend)
    const trendConditions = [...conditions];
    if (filterType && filterType !== "all") {
      trendConditions.push(eq(transactions.type, filterType));
    }

    const trendRows = await db
      .select({
        amount: transactions.amount,
        type: transactions.type,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...trendConditions))
      .orderBy(asc(transactions.createdAt));

    let rollingBalance = 0;
    const manaPoints = trendRows.map((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "income") {
        rollingBalance += amt;
      } else {
        rollingBalance -= amt;
      }
      return {
        date: t.createdAt.toISOString(),
        balance: rollingBalance,
      };
    });

    return {
      data: {
        totalIncome,
        totalExpense,
        categorySpentMap,
        manaPoints,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch analytics data:", error);
    return {
      data: {
        totalIncome: 0,
        totalExpense: 0,
        categorySpentMap: {},
        manaPoints: [],
      },
      error: error.message || "Failed to load analytics data.",
    };
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

      // Edge case: prevent expense from locked pocket
      if (type === "expense" && pocket.isLocked) {
        throw new Error(`Pocket "${pocket.name}" is locked for saving. Unlock it before logging an expense.`);
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

      // Edge case: prevent transfer out from locked pocket
      if (fromPocket.isLocked) {
        throw new Error(`Pocket "${fromPocket.name}" is locked. Unlock it first before transferring funds.`);
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
