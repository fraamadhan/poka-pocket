"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import BrutalistFooter from "@/components/BrutalistFooter";
import { createPocket, updatePocket, deletePocket } from "@/app/actions/pockets";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import { createTransaction } from "@/app/actions/transactions";
import { generateExcelExport, deleteExportRecord } from "@/app/actions/exports";
import { submitFeedback } from "@/app/actions/feedback";

// Sub-components
import PocketForm from "./components/PocketForm";
import CategoryForm from "./components/CategoryForm";
import TransactionForm from "./components/TransactionForm";
import LogsTab from "./components/LogsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import ExportsTab from "./components/ExportsTab";
import FeedbackTab from "./components/FeedbackTab";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  budgetLimit: string | null;
  icon: string;
  createdAt: Date;
}

interface Transaction {
  id: string;
  amount: string;
  type: "expense" | "income";
  description: string | null;
  createdAt: Date;
  pocketName: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
}

interface ExportRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
}

interface QueuedTransaction {
  id: string;
  amount: string;
  type: "expense" | "income";
  pocketId: string;
  categoryId: string | null;
  description: string;
  createdAt: string;
}

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  initialPockets: Pocket[];
  initialCategories: Category[];
  initialTransactions: Transaction[];
  initialExports: ExportRecord[];
}

export default function DashboardClient({ 
  user, 
  initialPockets, 
  initialCategories, 
  initialTransactions,
  initialExports
}: DashboardClientProps) {
  // Navigation State: "logs", "analytics", "exports", or "feedback"
  const [activeTab, setActiveTab] = useState<"logs" | "analytics" | "exports" | "feedback">("logs");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installMinimized, setInstallMinimized] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const TOUR_STEPS = [
    {
      title: "🪙 Welcome to Poka Pocket!",
      content: "Poka Pocket is your cute, neo-brutalist offline-first personal pocket money tracker. Let's take a quick tour!",
      tab: "logs" as const
    },
    {
      title: "💼 Your Pockets",
      content: "Create pockets (like Wallet, BRI, Mandiri, Cash) to hold your balances. Click '+ NEW POCKET' to make your first one!",
      tab: "logs" as const
    },
    {
      title: "🏷️ Budget Categories",
      content: "Create categories (Food, Travel, Games) and set optional monthly limits. Emojis change color dynamically if you are near or over budget!",
      tab: "logs" as const
    },
    {
      title: "💸 Log Transactions",
      content: "Click 'LOG AN EXPENSE' to log income/expense items. Our custom Virtual NumPad makes mobile tracking seamless without keyboard layout shifts!",
      tab: "logs" as const
    },
    {
      title: "📜 Activity History",
      content: "View, filter (by date ranges), and page through your recent transaction logs.",
      tab: "logs" as const
    },
    {
      title: "📊 Tome of Analytics",
      content: "Track your balance trend curve, view income vs expense ratio pillars, and monitor exact spending allocations per category.",
      tab: "analytics" as const
    },
    {
      title: "📂 Excel Exports",
      content: "Export your ledger to structured Excel spreadsheets, complete with auto-filters, formulas, and secure Cloudinary back-ups.",
      tab: "exports" as const
    }
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMinimized = sessionStorage.getItem("poka_pocket_install_minimized") === "true";
    setInstallMinimized(isMinimized);

    const tourDone = localStorage.getItem("poka_pocket_tour_completed") === "true";
    if (!tourDone) {
      setTourActive(true);
    }
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!showInstallBtn) {
        setShowInstallBtn(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const isRunningStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setIsStandalone(!!isRunningStandalone);

    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIOS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [showInstallBtn]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted PWA installation");
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const showInstallBanner = (!isStandalone && !installMinimized) && (showInstallBtn || isIOS);
  const showMinimizedBtn = (!isStandalone && installMinimized) && (showInstallBtn || isIOS);

  // Auto-scroll highlighted section into view during Help Tour
  useEffect(() => {
    if (!tourActive) return;
    const elementIds = [
      "tour-top",             // Step 0: Welcome (scroll to top)
      "tour-pockets",         // Step 1: Pockets
      "tour-categories",      // Step 2: Categories
      "tour-log-expense",     // Step 3: Log expense button
      "tour-recent-activity", // Step 4: Recent logs
      "tour-top",             // Step 5: Analytics tab (scroll to top)
      "tour-top"              // Step 6: Exports tab (scroll to top)
    ];
    
    const targetId = elementIds[tourStep];
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [tourStep, tourActive]);

  // Recent Activity list state
  const [recentPage, setRecentPage] = useState(1);
  const [recentFilter, setRecentFilter] = useState<"day" | "week" | "month" | "3months" | "6months" | "year" | "custom" | "all">("all");
  const [recentStartDate, setRecentStartDate] = useState("");
  const [recentEndDate, setRecentEndDate] = useState("");

  const formatTransactionDateTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    const datePart = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${datePart}, ${hours}:${minutes}`;
  };

  // Export History State
  const [exportsList, setExportsList] = useState<ExportRecord[]>(initialExports);
  const [isExporting, setIsExporting] = useState(false);
  const [exportRange, setExportRange] = useState<"all" | "month" | "week" | "day" | "custom">("all");
  const [exportType, setExportType] = useState<"all" | "expense" | "income">("all");
  const [exportPocket, setExportPocket] = useState<string>("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const handleDeleteExport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this export record from history? This will also remove it from Cloudinary.")) {
      return;
    }
    setIsSubmitting(true);
    const res = await deleteExportRecord(id);
    if (res.success) {
      setExportsList(exportsList.filter((e) => e.id !== id));
    } else {
      alert(res.error || "Failed to delete export record.");
    }
    setIsSubmitting(false);
  };

  // Pocket States
  const [pocketsList, setPocketsList] = useState<Pocket[]>(initialPockets);
  const [isCreatingPocket, setIsCreatingPocket] = useState(false);
  const [editingPocket, setEditingPocket] = useState<Pocket | null>(null);
  const [pocketName, setPocketName] = useState("");
  const [pocketBalance, setPocketBalance] = useState("");
  const [pocketIcon, setPocketIcon] = useState("wallet");

  // Category States
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBudget, setCategoryBudget] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("burger");

  // Transaction States
  const [transactionsList, setTransactionsList] = useState<Transaction[]>(initialTransactions);
  const [isLoggingTransaction, setIsLoggingTransaction] = useState(false);
  const [transAmount, setTransAmount] = useState("");
  const [transType, setTransType] = useState<"expense" | "income">("expense");
  const [transPocketId, setTransPocketId] = useState("");
  const [transCategoryId, setTransCategoryId] = useState("");
  const [transDescription, setTransDescription] = useState("");

  // Common UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastKey((prev) => prev + 1);
    setShowToast(true);
  };

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "log-expense") {
        handleOpenLogTransaction("expense");
      } else if (action === "log-income") {
        handleOpenLogTransaction("income");
      }
      if (action) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [pocketsList]);

  // Offline Sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOfflineTransactions = async () => {
      if (!navigator.onLine) return;
      const rawQueue = localStorage.getItem("poka_pocket_offline_queue");
      if (!rawQueue) return;
      try {
        const queue: QueuedTransaction[] = JSON.parse(rawQueue);
        if (queue.length === 0) return;

        triggerToast(`Syncing ${queue.length} offline transaction(s)...`);
        
        const failedToSync: QueuedTransaction[] = [];

        for (const item of queue) {
          const res = await createTransaction(
            item.amount,
            item.type,
            item.pocketId,
            item.categoryId,
            item.description
          );
          if ('error' in res) {
            failedToSync.push(item);
          }
        }

        if (failedToSync.length > 0) {
          localStorage.setItem("poka_pocket_offline_queue", JSON.stringify(failedToSync));
          triggerToast(`Some offline transactions failed to sync. Will retry later.`);
        } else {
          localStorage.removeItem("poka_pocket_offline_queue");
          triggerToast("All offline transactions successfully synced!");
        }
      } catch (err) {
        console.error("Error syncing offline transactions", err);
      }
    };

    window.addEventListener("online", syncOfflineTransactions);
    syncOfflineTransactions();

    return () => {
      window.removeEventListener("online", syncOfflineTransactions);
    };
  }, []);

  // Desktop Keyboard Listener for Custom NumPad Amount Form
  useEffect(() => {
    if (!isLoggingTransaction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.id === "trans-desc-input") {
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        setTransAmount((prev) => {
          if (prev.includes(".")) {
            const parts = prev.split(".");
            if (parts[1] && parts[1].length >= 2) return prev;
          }
          if (prev === "0" && e.key === "0") return prev;
          if (prev === "0") return e.key;
          return prev + e.key;
        });
      } else if (e.key === ".") {
        setTransAmount((prev) => {
          if (prev.includes(".")) return prev;
          if (prev === "") return "0.";
          return prev + ".";
        });
      } else if (e.key === "Backspace") {
        setTransAmount((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggingTransaction]);

  // Get user's first name
  const displayName = user.name ? user.name.split(" ")[0] : "User";

  // Calculate total balance
  const totalBalance = pocketsList.reduce((sum, p) => sum + parseFloat(p.balance), 0);

  // Calculate spent per category globally (for the current calendar month)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const categorySpentMap = transactionsList
    .filter((t) => t.type === "expense" && new Date(t.createdAt) >= currentMonthStart)
    .reduce((map, t) => {
      if (t.categoryName) {
        map[t.categoryName] = (map[t.categoryName] || 0) + parseFloat(t.amount);
      }
      return map;
    }, {} as Record<string, number>);

  // --- Pocket Actions ---
  const handleOpenCreatePocket = () => {
    setPocketName("");
    setPocketBalance("");
    setPocketIcon("wallet");
    setError(null);
    setIsCreatingPocket(true);
    setEditingPocket(null);
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setIsLoggingTransaction(false);
  };

  const handleOpenEditPocket = (pocket: Pocket) => {
    setPocketName(pocket.name);
    setPocketBalance(parseFloat(pocket.balance).toString());
    setPocketIcon(pocket.icon);
    setError(null);
    setEditingPocket(pocket);
    setIsCreatingPocket(false);
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setIsLoggingTransaction(false);
  };

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pocketName.trim()) {
      triggerToast("Pocket name is required.");
      return;
    }
    const normalizedBalance = pocketBalance.replace(',', '.');
    const val = parseFloat(normalizedBalance);
    if (isNaN(val)) {
      triggerToast("Starting balance must be a valid number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createPocket(pocketName, pocketBalance, pocketIcon);
    if (res.success) {
      const newPocket: Pocket = {
        id: crypto.randomUUID(),
        name: pocketName.trim(),
        balance: val.toFixed(2),
        icon: pocketIcon,
        createdAt: new Date(),
      };
      setPocketsList([...pocketsList, newPocket]);
      setIsCreatingPocket(false);
    } else {
      triggerToast(res.error || "Failed to create pocket.");
    }
    setIsSubmitting(false);
  };

  const handleUpdatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPocket) return;
    if (!pocketName.trim()) {
      triggerToast("Pocket name is required.");
      return;
    }
    const normalizedBalance = pocketBalance.replace(',', '.');
    const val = parseFloat(normalizedBalance);
    if (isNaN(val)) {
      triggerToast("Balance must be a valid number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await updatePocket(editingPocket.id, pocketName, pocketBalance, pocketIcon);
    if (res.success) {
      setPocketsList(
        pocketsList.map((p) =>
          p.id === editingPocket.id
            ? { ...p, name: pocketName.trim(), balance: val.toFixed(2), icon: pocketIcon }
            : p
        )
      );
      setEditingPocket(null);
    } else {
      triggerToast(res.error || "Failed to update pocket.");
    }
    setIsSubmitting(false);
  };

  const handleDeletePocket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pocket? All records inside will be permanently deleted.")) {
      return;
    }

    setIsSubmitting(true);
    const res = await deletePocket(id);
    if (res.success) {
      setPocketsList(pocketsList.filter((p) => p.id !== id));
      if (editingPocket?.id === id) {
        setEditingPocket(null);
      }
    } else {
      alert(res.error || "Failed to delete pocket.");
    }
    setIsSubmitting(false);
  };

  // --- Category Actions ---
  const handleOpenCreateCategory = () => {
    setCategoryName("");
    setCategoryBudget("");
    setCategoryIcon("burger");
    setError(null);
    setIsCreatingCategory(true);
    setEditingCategory(null);
    setIsCreatingPocket(false);
    setEditingPocket(null);
    setIsLoggingTransaction(false);
  };

  const handleOpenEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setCategoryBudget(category.budgetLimit ? parseFloat(category.budgetLimit).toString() : "");
    setCategoryIcon(category.icon);
    setError(null);
    setEditingCategory(category);
    setIsCreatingCategory(false);
    setIsCreatingPocket(false);
    setEditingPocket(null);
    setIsLoggingTransaction(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      triggerToast("Category name is required.");
      return;
    }

    let limitVal: string | null = null;
    if (categoryBudget.trim() !== "") {
      const normalizedBudget = categoryBudget.replace(',', '.');
      const val = parseFloat(normalizedBudget);
      if (isNaN(val)) {
        triggerToast("Budget limit must be a valid number.");
        return;
      }
      limitVal = val.toFixed(2);
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createCategory(categoryName, categoryBudget, categoryIcon);
    if (res.success) {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        name: categoryName.trim(),
        budgetLimit: limitVal,
        icon: categoryIcon,
        createdAt: new Date(),
      };
      setCategoriesList([...categoriesList, newCategory]);
      setIsCreatingCategory(false);
    } else {
      triggerToast(res.error || "Failed to create category.");
    }
    setIsSubmitting(false);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!categoryName.trim()) {
      triggerToast("Category name is required.");
      return;
    }

    let limitVal: string | null = null;
    if (categoryBudget.trim() !== "") {
      const normalizedBudget = categoryBudget.replace(',', '.');
      const val = parseFloat(normalizedBudget);
      if (isNaN(val)) {
        triggerToast("Budget limit must be a valid number.");
        return;
      }
      limitVal = val.toFixed(2);
    }

    setIsSubmitting(true);
    setError(null);

    const res = await updateCategory(editingCategory.id, categoryName, categoryBudget, categoryIcon);
    if (res.success) {
      setCategoriesList(
        categoriesList.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: categoryName.trim(), budgetLimit: limitVal, icon: categoryIcon }
            : c
        )
      );
      setEditingCategory(null);
    } else {
      triggerToast(res.error || "Failed to update category.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setIsSubmitting(true);
    const res = await deleteCategory(id);
    if (res.success) {
      setCategoriesList(categoriesList.filter((c) => c.id !== id));
      if (editingCategory?.id === id) {
        setEditingCategory(null);
      }
    } else {
      alert(res.error || "Failed to delete category.");
    }
    setIsSubmitting(false);
  };

  // --- Transaction Actions ---
  const handleOpenLogTransaction = (type: "expense" | "income" = "expense") => {
    if (pocketsList.length === 0) return;
    setTransAmount("");
    setTransType(type);
    
    let defaultPocket = pocketsList[0];
    if (type === "expense") {
      const positivePocket = pocketsList.find((p) => parseFloat(p.balance) > 0);
      if (positivePocket) {
        defaultPocket = positivePocket;
      }
    }
    setTransPocketId(defaultPocket.id);
    setTransCategoryId("");
    setTransDescription("");
    setError(null);
    setIsLoggingTransaction(true);
    setIsCreatingPocket(false);
    setEditingPocket(null);
    setIsCreatingCategory(false);
    setEditingCategory(null);
  };

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transPocketId) {
      triggerToast("Please select a pocket.");
      return;
    }

    const normalizedAmount = transAmount.replace(',', '.');
    const numericAmount = parseFloat(normalizedAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      triggerToast("Please enter a valid amount greater than 0.");
      return;
    }

    if (transType === "expense") {
      const selectedPocket = pocketsList.find((p) => p.id === transPocketId);
      if (selectedPocket) {
        const balance = parseFloat(selectedPocket.balance);
        if (balance <= 0) {
          triggerToast("Cannot log an expense from a pocket with no balance.");
          return;
        }
        if (numericAmount > balance) {
          triggerToast("gabisa ditambah boy orang duit di pocket lu segitu tp expensenya gede.");
          return;
        }
      }
    }

    const isOffline = typeof window !== "undefined" && !navigator.onLine;

    if (isOffline) {
      const tempId = crypto.randomUUID();
      const selectedPocket = pocketsList.find((p) => p.id === transPocketId);
      const selectedCategory = categoriesList.find((c) => c.id === transCategoryId);

      let newBalance = "0.00";
      if (selectedPocket) {
        const currentBal = parseFloat(selectedPocket.balance);
        const diff = transType === "expense" ? -numericAmount : numericAmount;
        newBalance = (currentBal + diff).toFixed(2);
      }

      setPocketsList(
        pocketsList.map((p) =>
          p.id === transPocketId ? { ...p, balance: newBalance } : p
        )
      );

      const newTrans: Transaction = {
        id: tempId,
        amount: numericAmount.toFixed(2),
        type: transType,
        description: transDescription.trim() || null,
        createdAt: new Date(),
        pocketName: selectedPocket?.name || "Unknown Pocket",
        categoryName: selectedCategory?.name || null,
        categoryIcon: selectedCategory?.icon || null,
      };

      setTransactionsList([newTrans, ...transactionsList]);
      setRecentPage(1);

      const rawQueue = localStorage.getItem("poka_pocket_offline_queue");
      const queue: QueuedTransaction[] = rawQueue ? JSON.parse(rawQueue) : [];
      queue.push({
        id: tempId,
        amount: transAmount,
        type: transType,
        pocketId: transPocketId,
        categoryId: transCategoryId || null,
        description: transDescription,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("poka_pocket_offline_queue", JSON.stringify(queue));

      triggerToast("Offline mode: Transaction saved locally and will sync when online!");
      setIsLoggingTransaction(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createTransaction(
      transAmount,
      transType,
      transPocketId,
      transCategoryId || null,
      transDescription
    );

    if ('error' in res) {
      triggerToast(res.error || "Failed to log transaction.");
    } else {
      setPocketsList(
        pocketsList.map((p) =>
          p.id === transPocketId ? { ...p, balance: res.newBalance! } : p
        )
      );

      const selectedPocket = pocketsList.find((p) => p.id === transPocketId);
      const selectedCategory = categoriesList.find((c) => c.id === transCategoryId);
      const newTrans: Transaction = {
        id: res.transId!,
        amount: numericAmount.toFixed(2),
        type: transType,
        description: transDescription.trim() || null,
        createdAt: new Date(),
        pocketName: selectedPocket?.name || "Unknown Pocket",
        categoryName: selectedCategory?.name || null,
        categoryIcon: selectedCategory?.icon || null,
      };
      setTransactionsList([newTrans, ...transactionsList]);
      setRecentPage(1);
      setIsLoggingTransaction(false);
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setIsCreatingPocket(false);
    setEditingPocket(null);
    setIsCreatingCategory(false);
    setEditingCategory(null);
    setIsLoggingTransaction(false);
    setError(null);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      setFeedbackStatus({ error: "Please write a message before submitting." });
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const res = await submitFeedback(feedbackRating, feedbackMessage);
      if (res.success) {
        setFeedbackStatus({ success: true });
        setFeedbackMessage("");
        setFeedbackRating(null);
      } else {
        setFeedbackStatus({ error: res.error || "Something went wrong." });
      }
    } catch (err) {
      setFeedbackStatus({ error: "Failed to connect to the server." });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // --- Filtering for Recent Activity list ---
  const filteredRecentTransactions = transactionsList.filter((t) => {
    const dateLimit = new Date();
    const transDate = new Date(t.createdAt);

    if (recentFilter === "day") {
      dateLimit.setDate(dateLimit.getDate() - 1);
      return transDate >= dateLimit;
    }
    if (recentFilter === "week") {
      dateLimit.setDate(dateLimit.getDate() - 7);
      return transDate >= dateLimit;
    }
    if (recentFilter === "month") {
      dateLimit.setMonth(dateLimit.getMonth() - 1);
      return transDate >= dateLimit;
    }
    if (recentFilter === "3months") {
      dateLimit.setMonth(dateLimit.getMonth() - 3);
      return transDate >= dateLimit;
    }
    if (recentFilter === "6months") {
      dateLimit.setMonth(dateLimit.getMonth() - 6);
      return transDate >= dateLimit;
    }
    if (recentFilter === "year") {
      dateLimit.setFullYear(dateLimit.getFullYear() - 1);
      return transDate >= dateLimit;
    }
    if (recentFilter === "custom") {
      if (recentStartDate) {
        const start = new Date(recentStartDate);
        start.setHours(0, 0, 0, 0);
        if (transDate < start) return false;
      }
      if (recentEndDate) {
        const end = new Date(recentEndDate);
        end.setHours(23, 59, 59, 999);
        if (transDate > end) return false;
      }
      return true;
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-transparent font-sans p-6 pb-28 justify-center items-center gap-6">
      
      {/* Central App Card (Mobile app shell) */}
      <main className="w-full max-w-md mx-auto bg-zinc-900 border-4 border-black text-white shadow-[6px_6px_0px_#000] flex flex-col justify-between">
        
        {/* Top Header */}
        <header id="tour-top" className="border-b-4 border-black p-4 bg-sky-blue flex items-center justify-between">
          <h1 className="font-cinzel text-xl font-bold tracking-wider text-dungeon">
            POKA POCKET 🪙
          </h1>
          <div className="font-vt323 text-xl bg-baby-pink border-2 border-black px-2 py-0.5 text-dungeon">
            ACTIVE MEMBER
          </div>
        </header>

        {/* Tab Selection Navigation */}
        <nav className="flex border-b-4 border-black text-[10px] sm:text-xs font-cinzel font-bold">
          <button
            onClick={() => { setActiveTab("logs"); handleCancel(); }}
            className={`flex-1 py-3 text-center transition-all border-r-2 border-black ${
              activeTab === "logs" ? "bg-zinc-900 text-white font-extrabold" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            🎮 Logs
          </button>
          <button
            onClick={() => { setActiveTab("analytics"); handleCancel(); }}
            className={`flex-1 py-3 text-center transition-all border-r-2 border-black ${
              activeTab === "analytics" ? "bg-zinc-900 text-white font-extrabold" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => { setActiveTab("exports"); handleCancel(); }}
            className={`flex-1 py-3 text-center transition-all border-r-2 border-black ${
              activeTab === "exports" ? "bg-zinc-900 text-white font-extrabold" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            📂 Exports
          </button>
          <button
            onClick={() => { setActiveTab("feedback"); handleCancel(); }}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "feedback" ? "bg-zinc-900 text-white font-extrabold" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            ✉️ Feedback
          </button>
        </nav>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col gap-6">
          
          {/* User Info Bar */}
          <div className="flex items-center gap-4 bg-zinc-950 border-4 border-black p-3 shadow-[3px_3px_0px_#000]">
            <img 
              src={user.image || "/img/default_profile_pic.jpg"} 
              alt={user.name || "Avatar"} 
              className="w-12 h-12 rounded-full border-2 border-black object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/img/default_profile_pic.jpg";
              }}
            />
            <div className="text-left flex-1">
              <h2 className="font-cinzel font-bold text-lg text-white leading-tight">
                Hi, {displayName}!
              </h2>
              <p className="text-xs text-zinc-400">
                {activeTab === "logs" ? "Manage pockets & log items." : "Audit budgets & liquidity trends."}
              </p>
            </div>
            <button
              onClick={() => {
                setTourStep(0);
                setActiveTab("logs");
                setTourActive(true);
              }}
              className="px-2 py-1 bg-sky-blue border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              title="Restart guide tour"
            >
              ❓ Help Tour
            </button>
          </div>

          {/* PWA Custom Install Banner */}
          {showInstallBanner && (
            <div className="bg-baby-pink border-4 border-black p-3 flex flex-col gap-2 shadow-[4px_4px_0px_#000] text-dungeon text-left relative animate-shake">
              <div className="flex justify-between items-start gap-1">
                <div>
                  <h4 className="font-cinzel font-bold text-sm text-dungeon">📲 Add to Home Page</h4>
                  <p className="text-[11px] font-sans mt-0.5 text-dungeon/90 font-semibold leading-normal">
                    {isIOS 
                      ? "On iOS: Tap Safari Share icon 📤 and select 'Add to Home Screen' for offline launch." 
                      : "Add Poka Pocket to your home screen for quick offline access and RPG shortcut logging!"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    sessionStorage.setItem("poka_pocket_install_minimized", "true");
                    setInstallMinimized(true);
                  }} 
                  className="font-bold border-2 border-black px-1.5 py-0.5 text-xs bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  title="Minimize install banner"
                >
                  ✕
                </button>
              </div>
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2 bg-sky-blue text-dungeon border-2 border-black font-cinzel text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  ADD TO HOME PAGE
                </button>
              )}
            </div>
          )}

          {/* PWA Minimized Install Banner Trigger */}
          {showMinimizedBtn && (
            <button
              onClick={() => {
                sessionStorage.setItem("poka_pocket_install_minimized", "false");
                setInstallMinimized(false);
              }}
              className="w-full py-2 bg-baby-pink hover:bg-pink-300 text-dungeon border-4 border-black font-cinzel text-xs font-bold shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              📲 ADD TO HOME PAGE
            </button>
          )}

          {/* Form Overlays for Pockets, Categories & Log Transaction */}
          {(isCreatingPocket || editingPocket) && (
            <PocketForm
              isCreatingPocket={isCreatingPocket}
              editingPocket={editingPocket}
              onSubmit={isCreatingPocket ? handleCreatePocket : handleUpdatePocket}
              onCancel={handleCancel}
              pocketName={pocketName}
              setPocketName={setPocketName}
              pocketBalance={pocketBalance}
              setPocketBalance={setPocketBalance}
              pocketIcon={pocketIcon}
              setPocketIcon={setPocketIcon}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {(isCreatingCategory || editingCategory) && (
            <CategoryForm
              isCreatingCategory={isCreatingCategory}
              editingCategory={editingCategory}
              onSubmit={isCreatingCategory ? handleCreateCategory : handleUpdateCategory}
              onCancel={handleCancel}
              categoryName={categoryName}
              setCategoryName={setCategoryName}
              categoryBudget={categoryBudget}
              setCategoryBudget={setCategoryBudget}
              categoryIcon={categoryIcon}
              setCategoryIcon={setCategoryIcon}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {isLoggingTransaction && (
            <TransactionForm
              onSubmit={handleLogTransaction}
              onCancel={handleCancel}
              transType={transType}
              setTransType={setTransType}
              transAmount={transAmount}
              setTransAmount={setTransAmount}
              transPocketId={transPocketId}
              setTransPocketId={setTransPocketId}
              transCategoryId={transCategoryId}
              setTransCategoryId={setTransCategoryId}
              transDescription={transDescription}
              setTransDescription={setTransDescription}
              pocketsList={pocketsList}
              categoriesList={categoriesList}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {/* TAB 1: Pockets & Logs */}
          {activeTab === "logs" && !isCreatingPocket && !editingPocket && !isCreatingCategory && !editingCategory && !isLoggingTransaction && (
            <LogsTab
              pocketsList={pocketsList}
              categoriesList={categoriesList}
              transactionsList={transactionsList}
              categorySpentMap={categorySpentMap}
              tourActive={tourActive}
              tourStep={tourStep}
              handleOpenCreatePocket={handleOpenCreatePocket}
              handleOpenEditPocket={handleOpenEditPocket}
              handleDeletePocket={handleDeletePocket}
              handleOpenCreateCategory={handleOpenCreateCategory}
              handleOpenEditCategory={handleOpenEditCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleOpenLogTransaction={handleOpenLogTransaction}
              recentFilter={recentFilter}
              setRecentFilter={setRecentFilter}
              recentStartDate={recentStartDate}
              setRecentStartDate={setRecentStartDate}
              recentEndDate={recentEndDate}
              setRecentEndDate={setRecentEndDate}
              recentPage={recentPage}
              setRecentPage={setRecentPage}
              filteredRecentTransactions={filteredRecentTransactions}
              formatTransactionDateTime={formatTransactionDateTime}
            />
          )}

          {/* TAB 2: Tome of Analytics */}
          {activeTab === "analytics" && (
            <AnalyticsTab
              pocketsList={pocketsList}
              categoriesList={categoriesList}
              transactionsList={transactionsList}
              totalBalance={totalBalance}
            />
          )}

          {/* TAB 3: Exports History */}
          {activeTab === "exports" && (
            <ExportsTab
              exportsList={exportsList}
              isExporting={isExporting}
              exportRange={exportRange}
              setExportRange={setExportRange}
              exportType={exportType}
              setExportType={setExportType}
              exportPocket={exportPocket}
              setExportPocket={setExportPocket}
              exportStartDate={exportStartDate}
              setExportStartDate={setExportStartDate}
              exportEndDate={exportEndDate}
              setExportEndDate={setExportEndDate}
              pocketsList={pocketsList}
              onExportTrigger={async () => {
                setIsExporting(true);
                setError(null);
                const res = await generateExcelExport({
                  range: exportRange,
                  type: exportType,
                  pocketId: exportPocket,
                  startDate: exportStartDate,
                  endDate: exportEndDate
                });
                if (res.success) {
                  const newRecord: ExportRecord = {
                    id: crypto.randomUUID(),
                    fileName: res.fileName!,
                    fileUrl: res.fileUrl!,
                    createdAt: new Date(),
                  };
                  setExportsList([newRecord, ...exportsList]);
                } else {
                  setError(res.error || "Failed to generate export.");
                }
                setIsExporting(false);
              }}
              onDeleteExport={handleDeleteExport}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {/* TAB 4: Feedback Form */}
          {activeTab === "feedback" && (
            <FeedbackTab
              feedbackRating={feedbackRating}
              setFeedbackRating={setFeedbackRating}
              feedbackMessage={feedbackMessage}
              setFeedbackMessage={setFeedbackMessage}
              isSubmittingFeedback={isSubmittingFeedback}
              feedbackStatus={feedbackStatus}
              onSubmit={handleFeedbackSubmit}
            />
          )}
        </div>

        {/* Inner Footer */}
        <footer className="border-t-4 border-black p-4 bg-dungeon text-white flex justify-between items-center text-sm">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-3 py-1 bg-baby-pink text-dungeon border-2 border-black font-cinzel text-sm font-bold hover:bg-pink-300"
          >
            ↩ LOGOUT
          </button>
          <span className="font-vt323 text-base text-sky-blue">
            BALANCE: Rp {totalBalance.toLocaleString("id-ID")}
          </span>
        </footer>

      </main>

      {/* Reusable Brutalist Footer */}
      <BrutalistFooter />

      {/* Interactive Tour Stepper Overlay */}
      {tourActive && (
        <div className={`w-[calc(100%-2rem)] max-w-sm bg-zinc-900 border-4 border-black text-white p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] z-50 flex flex-col gap-3 transition-all ${
          (tourStep === 3 || tourStep === 4) ? "fixed top-24 left-1/2 -translate-x-1/2" : "fixed bottom-24 left-1/2 -translate-x-1/2"
        }`}>
          <div className="flex justify-between items-center border-b-2 border-black pb-1">
            <h4 className="font-cinzel font-bold text-sm text-sky-blue">{TOUR_STEPS[tourStep].title}</h4>
            <span className="font-mono text-xs text-zinc-400">{tourStep + 1} / {TOUR_STEPS.length}</span>
          </div>
          <p className="text-xs leading-normal font-sans text-zinc-300">
            {TOUR_STEPS[tourStep].content}
          </p>
          <div className="flex justify-between items-center mt-1">
            <button
              onClick={() => {
                setTourActive(false);
                localStorage.setItem("poka_pocket_tour_completed", "true");
              }}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              {tourStep > 0 && (
                <button
                  onClick={() => {
                    const prevIndex = tourStep - 1;
                    setTourStep(prevIndex);
                    setActiveTab(TOUR_STEPS[prevIndex].tab);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  ◀ PREV
                </button>
              )}
              <button
                onClick={() => {
                  if (tourStep < TOUR_STEPS.length - 1) {
                    const nextIndex = tourStep + 1;
                    setTourStep(nextIndex);
                    setActiveTab(TOUR_STEPS[nextIndex].tab);
                  } else {
                    setTourActive(false);
                    localStorage.setItem("poka_pocket_tour_completed", "true");
                  }
                }}
                className="px-3 py-1 bg-sky-blue hover:bg-sky-300 text-dungeon font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                {tourStep === TOUR_STEPS.length - 1 ? "FINISH 🏁" : "NEXT ▶"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Toast */}
      {showToast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            key={toastKey}
            className="w-full max-w-sm bg-zinc-900 border-4 border-black text-white p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.8)] animate-shake flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mt-1">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-cinzel text-red-500 font-extrabold tracking-widest text-sm uppercase">
                  ⚠️ ERROR OCCURRED
                </h3>
                <p className="font-vt323 text-red-300 text-sm mt-1 leading-snug">
                  {toastMessage}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setShowToast(false)}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
