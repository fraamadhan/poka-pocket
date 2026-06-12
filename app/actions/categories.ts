"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getCategories() {
  try {
    const userId = await getUserId();
    let result = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: (categories, { asc }) => [asc(categories.createdAt)],
    });

    // 1. Deduplicate existing categories in case of race conditions from previous calls
    const uniqueMap = new Map<string, typeof result[0]>();
    const duplicatesToDelete: string[] = [];
    for (const cat of result) {
      const key = cat.name.toLowerCase().trim();
      if (uniqueMap.has(key)) {
        duplicatesToDelete.push(cat.id);
      } else {
        uniqueMap.set(key, cat);
      }
    }

    if (duplicatesToDelete.length > 0) {
      for (const id of duplicatesToDelete) {
        await db.delete(categories).where(eq(categories.id, id));
      }
      // Re-fetch clean list
      result = await db.query.categories.findMany({
        where: eq(categories.userId, userId),
        orderBy: (categories, { asc }) => [asc(categories.createdAt)],
      });
    }

    // 2. Safe Seeding
    const defaultCats = [
      { name: "Transportation", icon: "car" },
      { name: "Food & Drinks", icon: "burger" },
      { name: "Salary & Allowance", icon: "bill" },
      { name: "Gift", icon: "gift" },
      { name: "Bill", icon: "bill" },
      { name: "Entertainment", icon: "game" },
      { name: "Education", icon: "scroll" },
      { name: "Others", icon: "shirt" },
    ];

    let holdsNewSeed = false;
    for (const cat of defaultCats) {
      const exists = result.some(
        (r) => r.name.toLowerCase().trim() === cat.name.toLowerCase().trim()
      );

      if (!exists) {
        await db.insert(categories).values({
          id: crypto.randomUUID(),
          userId,
          name: cat.name,
          budgetLimit: null,
          icon: cat.icon,
        });
        holdsNewSeed = true;
      }
    }

    if (holdsNewSeed) {
      // Re-fetch seeded categories
      result = await db.query.categories.findMany({
        where: eq(categories.userId, userId),
        orderBy: (categories, { asc }) => [asc(categories.createdAt)],
      });
    }

    return { data: result };
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    return { error: error.message || "Failed to load categories." };
  }
}

export async function createCategory(name: string, budgetLimit: string | null, icon: string = "burger") {
  if (!name || name.trim() === "") {
    return { error: "Category name cannot be empty." };
  }

  let finalBudget: string | null = null;
  if (budgetLimit && budgetLimit.trim() !== "") {
    const normalizedBudget = budgetLimit.replace(',', '.');
    const numericBudget = parseFloat(normalizedBudget);
    if (isNaN(numericBudget)) {
      return { error: "Invalid budget limit format." };
    }
    finalBudget = numericBudget.toFixed(2);
  }

  try {
    const userId = await getUserId();
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      budgetLimit: finalBudget,
      icon,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create category:", error);
    return { error: error.message || "Failed to create category." };
  }
}

export async function updateCategory(id: string, name: string, budgetLimit: string | null, icon: string) {
  if (!id) {
    return { error: "Category ID is required." };
  }
  if (!name || name.trim() === "") {
    return { error: "Category name cannot be empty." };
  }

  let finalBudget: string | null = null;
  if (budgetLimit && budgetLimit.trim() !== "") {
    const normalizedBudget = budgetLimit.replace(',', '.');
    const numericBudget = parseFloat(normalizedBudget);
    if (isNaN(numericBudget)) {
      return { error: "Invalid budget limit format." };
    }
    finalBudget = numericBudget.toFixed(2);
  }

  try {
    const userId = await getUserId();
    await db
      .update(categories)
      .set({
        name: name.trim(),
        budgetLimit: finalBudget,
        icon,
      })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update category:", error);
    return { error: error.message || "Failed to update category." };
  }
}

export async function deleteCategory(id: string) {
  if (!id) {
    return { error: "Category ID is required." };
  }

  try {
    const userId = await getUserId();
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    return { error: error.message || "Failed to delete category." };
  }
}
