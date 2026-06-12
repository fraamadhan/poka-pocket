import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getPockets } from "@/app/actions/pockets";
import { getCategories } from "@/app/actions/categories";
import { getRecentTransactions } from "@/app/actions/transactions";
import { getExportHistory } from "@/app/actions/exports";

export const metadata: Metadata = {
  title: "Dashboard | Poka Pocket",
  description: "View financial stats, inspect category budget alerts, check allowance history, or log a new transaction.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const pocketsResponse = await getPockets();
  const pocketsList = pocketsResponse.data || [];

  const categoriesResponse = await getCategories();
  const categoriesList = categoriesResponse.data || [];

  const transactionsResponse = await getRecentTransactions();
  const transactionsList = transactionsResponse.data || [];

  const exportsResponse = await getExportHistory();
  const exportsList = exportsResponse.data || [];

  return (
    <DashboardClient 
      user={session.user} 
      initialPockets={pocketsList} 
      initialCategories={categoriesList} 
      initialTransactions={transactionsList}
      initialExports={exportsList}
    />
  );
}
