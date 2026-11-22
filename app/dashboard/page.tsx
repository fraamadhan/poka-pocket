import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getPockets } from "@/app/actions/pockets";
import { getCategories } from "@/app/actions/categories";
import {
  getRecentTransactions,
  getCurrentMonthCategorySpent,
  getAnalyticsData,
} from "@/app/actions/transactions";
import { getExportHistory } from "@/app/actions/exports";
import { getRecurringRules, processPendingRecurringRules } from "@/app/actions/recurring";

export const metadata: Metadata = {
  title: "Dashboard | Poka Pocket",
  description: "View financial stats, inspect category budget alerts, check allowance history, or log a new transaction.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // Automatic catch-up: process any overdue recurring transactions (protected by atomic row lock)
  if (session.user.id) {
    await processPendingRecurringRules(session.user.id, { shouldRevalidate: false });
  }

  const [
    pocketsResponse,
    categoriesResponse,
    recentTransactionsResponse,
    exportsResponse,
    recurringResponse,
    categorySpentResponse,
    analyticsResponse,
  ] = await Promise.all([
    getPockets(),
    getCategories(),
    getRecentTransactions({ filter: "all", page: 1, pageSize: 5 }),
    getExportHistory(),
    getRecurringRules(),
    getCurrentMonthCategorySpent(),
    getAnalyticsData({ filterTime: "this_month", filterPocket: "all", filterCategory: "all", filterType: "all" }),
  ]);

  const pocketsList = pocketsResponse.data || [];
  const categoriesList = categoriesResponse.data || [];
  const recentTransactionsData = recentTransactionsResponse.data || [];
  const recentTotalPages = recentTransactionsResponse.totalPages || 1;
  const exportsList = exportsResponse.data || [];
  const recurringList = recurringResponse.data || [];
  const categorySpentMap = categorySpentResponse.data || {};
  const initialAnalyticsData = analyticsResponse.data || {
    totalIncome: 0,
    totalExpense: 0,
    categorySpentMap: {},
    manaPoints: [],
  };

  return (
    <DashboardClient 
      user={session.user} 
      initialPockets={pocketsList} 
      initialCategories={categoriesList} 
      initialRecentTransactions={recentTransactionsData}
      initialRecentTotalPages={recentTotalPages}
      initialCategorySpentMap={categorySpentMap}
      initialAnalyticsData={initialAnalyticsData}
      initialExports={exportsList}
      initialRecurringRules={recurringList}
    />
  );
}

