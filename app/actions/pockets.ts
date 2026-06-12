"use server";

import { db } from "@/db";
import { pockets } from "@/db/schema";
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

export async function getPockets() {
  try {
    const userId = await getUserId();
    const result = await db.query.pockets.findMany({
      where: eq(pockets.userId, userId),
      orderBy: (pockets, { asc }) => [asc(pockets.createdAt)],
    });
    return { data: result };
  } catch (error: any) {
    console.error("Failed to fetch pockets:", error);
    return { error: error.message || "Failed to load pockets." };
  }
}

export async function createPocket(name: string, balance: string, icon: string = "wallet") {
  if (!name || name.trim() === "") {
    return { error: "Pocket name cannot be empty." };
  }
  const normalizedBalance = balance.replace(',', '.');
  const numericBalance = parseFloat(normalizedBalance);
  if (isNaN(numericBalance)) {
    return { error: "Invalid balance format." };
  }

  try {
    const userId = await getUserId();
    await db.insert(pockets).values({
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      balance: numericBalance.toFixed(2),
      icon,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create pocket:", error);
    return { error: error.message || "Failed to create pocket." };
  }
}

export async function updatePocket(id: string, name: string, balance: string, icon: string) {
  if (!id) {
    return { error: "Pocket ID is required." };
  }
  if (!name || name.trim() === "") {
    return { error: "Pocket name cannot be empty." };
  }
  const normalizedBalance = balance.replace(',', '.');
  const numericBalance = parseFloat(normalizedBalance);
  if (isNaN(numericBalance)) {
    return { error: "Invalid balance format." };
  }

  try {
    const userId = await getUserId();
    const updated = await db
      .update(pockets)
      .set({
        name: name.trim(),
        balance: numericBalance.toFixed(2),
        icon,
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
