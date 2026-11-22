import React, { useState, useEffect } from "react";
import BrutalistSelect from "@/components/BrutalistSelect";
import { getPocketTransactions } from "@/app/actions/transactions";
import { POCKET_COLOR_OPTIONS, parsePocketIcon, getPocketEmoji, getPocketTheme } from "./PocketForm";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
  isGoal?: boolean;
  targetAmount?: string | null;
  targetDate?: Date | string | null;
  isLocked?: boolean;
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

interface LogsTabProps {
  pocketsList: Pocket[];
  categoriesList: Category[];
  totalBalance?: number;
  transactionsList?: Transaction[];
  categorySpentMap: Record<string, number>;
  tourActive: boolean;
  tourStep: number;
  handleOpenCreatePocket: () => void;
  handleOpenEditPocket: (pocket: Pocket) => void;
  handleDeletePocket: (id: string) => void;
  handleOpenTransfer: () => void;
  handleOpenRecurring?: () => void;
  recurringCount?: number;
  handleOpenCreateCategory: () => void;
  handleOpenEditCategory: (category: Category) => void;
  handleDeleteCategory: (id: string) => void;
  handleOpenLogTransaction: (type: "expense" | "income") => void;
  recentFilter: "day" | "week" | "this_month" | "month" | "3months" | "6months" | "year" | "custom" | "all";
  setRecentFilter: (val: "day" | "week" | "this_month" | "month" | "3months" | "6months" | "year" | "custom" | "all") => void;
  recentStartDate: string;
  setRecentStartDate: (val: string) => void;
  recentEndDate: string;
  setRecentEndDate: (val: string) => void;
  recentCategory?: string;
  setRecentCategory?: (val: string) => void;
  recentPage: number;
  setRecentPage: React.Dispatch<React.SetStateAction<number>>;
  recentTotalPages?: number;
  isRecentLoading?: boolean;
  filteredRecentTransactions: Transaction[];
  formatTransactionDateTime: (dateInput: Date | string) => string;
}

export function getCategoryEmoji(icon: string | null) {
  if (!icon) return "👕";
  switch (icon) {
    case "car": return "🚗";
    case "burger": return "🍔";
    case "gift": return "🎁";
    case "bill": return "💵";
    case "game": return "🎮";
    case "scroll": return "📚";
    case "shopping": return "🛍️";
    case "coffee": return "☕";
    case "popcorn": return "🍿";
    case "heart": return "❤️";
    case "laptop": return "💻";
    case "home": return "🏠";
    case "shirt":
    default:
      return "👕";
  }
}

export default function LogsTab({
  pocketsList,
  categoriesList,
  totalBalance,
  transactionsList,
  categorySpentMap,
  tourActive,
  tourStep,
  handleOpenCreatePocket,
  handleOpenEditPocket,
  handleDeletePocket,
  handleOpenTransfer,
  handleOpenRecurring,
  recurringCount = 0,
  handleOpenCreateCategory,
  handleOpenEditCategory,
  handleDeleteCategory,
  handleOpenLogTransaction,
  recentFilter,
  setRecentFilter,
  recentStartDate,
  setRecentStartDate,
  recentEndDate,
  setRecentEndDate,
  recentCategory = "all",
  setRecentCategory = () => { },
  recentPage,
  setRecentPage,
  recentTotalPages = 1,
  isRecentLoading = false,
  filteredRecentTransactions,
  formatTransactionDateTime,
}: LogsTabProps) {
  // Modal states for Transaction Details and Pocket Details
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedPocket, setSelectedPocket] = useState<Pocket | null>(null);
  const [pocketTransactions, setPocketTransactions] = useState<Transaction[]>([]);
  const [isLoadingPocketTrans, setIsLoadingPocketTrans] = useState(false);
  const [pocketViewMode, setPocketViewMode] = useState<"grid" | "list">("grid");

  // Fetch transactions for selected pocket
  useEffect(() => {
    if (!selectedPocket) {
      setPocketTransactions([]);
      return;
    }
    let isMounted = true;
    setIsLoadingPocketTrans(true);
    getPocketTransactions(selectedPocket.id).then((res) => {
      if (isMounted) {
        setPocketTransactions((res.data as any) || []);
        setIsLoadingPocketTrans(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedPocket]);

  // Lock body scroll when pocket or transaction detail modal is open
  useEffect(() => {
    if (selectedPocket || selectedTransaction) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedPocket, selectedTransaction]);

  const computedTotalBalance = totalBalance !== undefined
    ? totalBalance
    : pocketsList.reduce((sum, p) => sum + (parseFloat(p.balance) || 0), 0);

  return (
    <>
      {/* Pocket list */}
      <div id="tour-pockets" className={`flex flex-col gap-3 transition-all ${tourActive && tourStep === 1 ? "border-4 border-sky-blue p-2 bg-sky-blue/5 animate-pulse rounded-lg" : ""}`}>
        {/* Header stacked as column */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <h3 className="font-cinzel font-bold text-base text-white tracking-wide">Your Pockets</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 border border-black font-mono font-bold">
                {pocketsList.length} POCKET{pocketsList.length !== 1 ? "S" : ""}
              </span>
              <div className="flex border-2 border-black bg-zinc-950 p-0.5 shadow-[1px_1px_0px_#000]">
                <button
                  type="button"
                  onClick={() => setPocketViewMode("grid")}
                  className={`px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${pocketViewMode === "grid" ? "bg-sky-blue text-dungeon shadow-[1px_1px_0px_#000]" : "text-zinc-400 hover:text-white"
                    }`}
                  title="2-Column Cards Grid (Bank Jago style)"
                >
                  ⊞ Cards
                </button>
                <button
                  type="button"
                  onClick={() => setPocketViewMode("list")}
                  className={`px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${pocketViewMode === "list" ? "bg-sky-blue text-dungeon shadow-[1px_1px_0px_#000]" : "text-zinc-400 hover:text-white"
                    }`}
                  title="Horizontal List"
                >
                  ☰ List
                </button>
              </div>
            </div>
          </div>

          {/* Balance card placed right below Your Pockets */}
          <div className="border-4 border-black bg-zinc-950 p-3 shadow-[3px_3px_0px_#000] flex justify-between items-center text-white">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                Total Balance
              </span>
              <span className="font-vt323 text-2xl text-sky-blue leading-none mt-0.5">
                Rp {computedTotalBalance.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-400">
                All Pockets
              </span>
            </div>
          </div>

          {/* Action buttons in a full-width grid */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {handleOpenRecurring && (
              <button
                onClick={handleOpenRecurring}
                className="px-2 py-1.5 bg-amber-400 border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 text-center truncate"
                title="Manage auto recurring transactions"
              >
                ⏰ AUTO {recurringCount > 0 ? `(${recurringCount})` : ""}
              </button>
            )}
            {pocketsList.length >= 2 ? (
              <button
                onClick={handleOpenTransfer}
                className="px-2 py-1.5 bg-yellow-400 border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 text-center truncate"
                title="Transfer funds between pockets"
              >
                🔄 TRANSFER
              </button>
            ) : (
              <button
                disabled
                className="px-2 py-1.5 bg-zinc-800 border-2 border-black text-zinc-500 text-xs font-bold shadow-[2px_2px_0px_#000] cursor-not-allowed flex items-center justify-center gap-1 text-center truncate"
                title="Create at least 2 pockets to transfer"
              >
                🔄 TRANSFER
              </button>
            )}
            <button
              onClick={handleOpenCreatePocket}
              className={`px-2 py-1.5 bg-sky-blue border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 text-center truncate ${tourActive && tourStep === 1 ? "scale-105" : ""
                }`}
            >
              + NEW POCKET
            </button>
          </div>
        </div>

        {pocketsList.length === 0 ? (
          <p className="text-zinc-400 text-xs p-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            No pockets created yet. Click "+ NEW POCKET" to get started!
          </p>
        ) : pocketViewMode === "grid" ? (
          /* Visual Cards Grid Mode (Bank Jago 2-column pocket cards) */
          <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 pb-2">
            {pocketsList.map((pocket, idx) => {
              const currentBalance = parseFloat(pocket.balance) || 0;
              const target = pocket.isGoal && pocket.targetAmount ? parseFloat(pocket.targetAmount) : null;
              const progressPercent = target && target > 0 ? Math.min(100, Math.max(0, (currentBalance / target) * 100)) : 0;
              const isGoalReached = target !== null && target > 0 && currentBalance >= target;
              const isOverdue = !!(pocket.targetDate && new Date(pocket.targetDate) < new Date() && !isGoalReached);
              const { icon: parsedIcon, color: parsedColor } = parsePocketIcon(pocket.icon, idx);
              const theme = getPocketTheme(parsedColor, idx);

              return (
                <div
                  key={pocket.id}
                  onClick={() => setSelectedPocket(pocket)}
                  className={`relative flex flex-col justify-between border-4 border-black p-3 bg-zinc-950 shadow-[3px_3px_0px_#000] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#000] transition-all text-white cursor-pointer group overflow-hidden select-none ${isGoalReached ? "ring-2 ring-amber-400" : ""
                    }`}
                  title="Click to view pocket transactions"
                >
                  {/* Top Color Accent Stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: theme.accent }}
                  />

                  {/* Card Header: Icon Badge & Quick Badges/Actions */}
                  <div className="flex items-start justify-between gap-1 w-full mt-0.5">
                    <div
                      className="w-9 h-9 border-2 border-black rounded flex items-center justify-center text-lg shadow-[1px_1px_0px_#000] flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: theme.accent, color: "#000" }}
                    >
                      {getPocketEmoji(parsedIcon)}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {pocket.isLocked && (
                          <span className="text-[9px] px-1 py-0.2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded" title="Locked Pocket">
                            🔒
                          </span>
                        )}
                        {pocket.isGoal && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 border border-black font-extrabold rounded ${isGoalReached ? "bg-amber-400 text-black animate-pulse shadow-[1px_1px_0px_#000]" : "bg-zinc-800 text-amber-300"
                              }`}
                            title={isGoalReached ? "Goal Reached!" : "Saving Goal"}
                          >
                            {isGoalReached ? "🏆" : "🎯"}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[9px] px-1 py-0.2 bg-red-950 border border-red-700 text-red-300 font-bold rounded" title="Target Date Overdue">
                            ⚠️
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditPocket(pocket);
                          }}
                          className="p-1 bg-zinc-900 border border-black hover:bg-sky-blue hover:text-black text-[10px] text-zinc-300 transition-colors shadow-[1px_1px_0px_#000] cursor-pointer"
                          title="Edit Pocket"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePocket(pocket.id);
                          }}
                          className={`p-1 border border-black text-[10px] transition-colors shadow-[1px_1px_0px_#000] ${pocket.isLocked
                              ? "bg-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed"
                              : "bg-zinc-900 text-zinc-300 hover:bg-baby-pink hover:text-black cursor-pointer"
                            }`}
                          title={pocket.isLocked ? "Locked pocket" : "Delete Pocket"}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Middle: Pocket Name & Subtitle */}
                  <div className="flex flex-col text-left mt-2.5 min-w-0">
                    <h4
                      className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors"
                      title={pocket.name}
                    >
                      {pocket.name}
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono capitalize">
                      {pocket.isGoal ? "Saving Goal" : pocket.isLocked ? "Locked Fund" : "Wallet"}
                    </span>
                  </div>

                  {/* Card Bottom: Balance & Goal Progress */}
                  <div className="flex flex-col text-left mt-2.5 pt-2 border-t border-zinc-800/80">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                      Balance
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-white truncate leading-tight mt-0.5">
                      Rp {currentBalance.toLocaleString("id-ID")}
                    </span>

                    {pocket.isGoal && target !== null && (
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                          <span className="text-amber-300 font-bold">{progressPercent.toFixed(0)}%</span>
                          <span className="truncate">Rp {target.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 border border-black overflow-hidden relative">
                          <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${progressPercent}%`, backgroundColor: theme.accent }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visual Cards List Mode (Horizontal with Theme Accent Bar) */
          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 pb-2">
            {pocketsList.map((pocket, idx) => {
              const currentBalance = parseFloat(pocket.balance) || 0;
              const target = pocket.isGoal && pocket.targetAmount ? parseFloat(pocket.targetAmount) : null;
              const progressPercent = target && target > 0 ? Math.min(100, Math.max(0, (currentBalance / target) * 100)) : 0;
              const isGoalReached = target !== null && target > 0 && currentBalance >= target;
              const remaining = target !== null && target > 0 ? Math.max(0, target - currentBalance) : 0;
              const isOverdue = !!(pocket.targetDate && new Date(pocket.targetDate) < new Date() && !isGoalReached);
              const { icon: parsedIcon, color: parsedColor } = parsePocketIcon(pocket.icon, idx);
              const theme = getPocketTheme(parsedColor, idx);

              return (
                <div
                  key={pocket.id}
                  onClick={() => setSelectedPocket(pocket)}
                  className={`w-full flex flex-col border-4 border-black p-3 bg-zinc-950 shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000] transition-all text-white cursor-pointer group relative overflow-hidden ${pocket.isGoal && isGoalReached ? "border-amber-400 bg-amber-950/10" : ""
                    }`}
                  style={{ borderLeftColor: theme.accent, borderLeftWidth: "8px" }}
                  title="Click to view pocket transactions"
                >
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    {/* Left: Icon & Pocket Name */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 border-2 border-black rounded flex items-center justify-center text-lg text-black shadow-[1px_1px_0px_#000] flex-shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: theme.accent }}
                      >
                        {getPocketEmoji(parsedIcon)}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-sky-300 transition-colors" title={pocket.name}>
                            {pocket.name}
                          </h4>
                          {pocket.isLocked && (
                            <span className="text-[9px] px-1 py-0.2 bg-zinc-800 border border-zinc-600 text-zinc-300 font-bold rounded" title="Locked Pocket">
                              🔒
                            </span>
                          )}
                          {pocket.isGoal && isGoalReached && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 border border-black text-black font-extrabold rounded animate-pulse" title="Goal Reached">
                              🏆
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[9px] px-1 py-0.2 bg-red-950 border border-red-700 text-red-300 font-bold rounded" title="Overdue">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono capitalize">
                          {pocket.isGoal ? "Saving Goal" : pocket.isLocked ? "Locked Fund" : "Wallet"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Nominal Balance & Quick Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block leading-none">Saldo</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-white block mt-0.5">
                          Rp {currentBalance.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditPocket(pocket);
                          }}
                          className="p-1.5 bg-sky-blue border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon cursor-pointer"
                          title="Edit Pocket"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePocket(pocket.id);
                          }}
                          className={`p-1.5 border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon cursor-pointer ${pocket.isLocked ? "bg-zinc-700 text-zinc-400 opacity-60 cursor-not-allowed" : "bg-baby-pink"
                            }`}
                          title={pocket.isLocked ? "Locked pocket (cannot be deleted)" : "Delete Pocket"}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Saving Goal Progress Bar (RPG XP Style) */}
                  {pocket.isGoal && target !== null && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-300 font-bold">
                        <span className="text-amber-300 flex items-center gap-1">
                          🎯 Target: Rp {target.toLocaleString("id-ID")}
                        </span>
                        <span className={isGoalReached ? "text-amber-400 font-extrabold" : "text-zinc-300"}>
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>

                      {/* XP / Mana Bar */}
                      <div className="w-full h-2.5 bg-zinc-900 border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000] relative">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${progressPercent}%`, backgroundColor: theme.accent }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-zinc-400">
                        <span>
                          {isGoalReached
                            ? "✨ Target amount reached!"
                            : `Rp ${remaining.toLocaleString("id-ID")} remaining`}
                        </span>
                        {pocket.targetDate && (
                          <span className={isOverdue ? "text-red-400 font-bold" : ""}>
                            📅 {new Date(pocket.targetDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category list with reactive warnings */}
      <div id="tour-categories" className={`flex flex-col gap-3 border-t-2 border-black pt-4 transition-all ${tourActive && tourStep === 2 ? "border-4 border-baby-pink p-2 bg-baby-pink/5 animate-pulse rounded-lg" : ""}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-cinzel font-bold text-md text-white">Your Categories</h3>
          <button
            onClick={handleOpenCreateCategory}
            className={`px-2 py-1 bg-baby-pink border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${tourActive && tourStep === 2 ? "scale-105" : ""}`}
          >
            + NEW CATEGORY
          </button>
        </div>

        {categoriesList.length === 0 ? (
          <p className="text-zinc-400 text-xs p-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            No categories created yet. Click "+ NEW CATEGORY" to add one!
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[235px] overflow-y-auto pr-1 pb-2">
            {categoriesList.map((cat) => {
              const spent = categorySpentMap[cat.name] || 0;
              const limit = cat.budgetLimit ? parseFloat(cat.budgetLimit) : null;
              const isOver = limit !== null && spent > limit;
              const isNear = limit !== null && !isOver && spent >= limit * 0.8;

              let cardBg = "bg-zinc-950";
              let borderStyle = "border-black";
              let warnEmoji = "";

              if (isOver) {
                cardBg = "bg-red-950/40 text-white animate-pulse";
                borderStyle = "border-red-600";
                warnEmoji = "🔥";
              } else if (isNear) {
                cardBg = "bg-amber-950/40 text-white";
                borderStyle = "border-amber-600";
                warnEmoji = "⚠️";
              }

              return (
                <div
                  key={cat.id}
                  className={`w-full flex items-center justify-between border-4 ${borderStyle} p-2 ${cardBg} shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000] transition-all`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-baby-pink border-2 border-black rounded flex items-center justify-center text-md text-dungeon shadow-[1px_1px_0px_#000] flex-shrink-0">
                      {warnEmoji ? warnEmoji : getCategoryEmoji(cat.icon)}
                    </div>
                    <div className="text-left min-w-0 flex-1 pr-3">
                      <h4 className="font-bold text-white text-sm truncate" title={cat.name}>
                        {cat.name} {isOver && <span className="text-red-400 text-[10px] uppercase font-mono tracking-tighter block mt-0.5">(Over Budget!)</span>}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono break-words leading-tight mt-0.5">
                        Spent: Rp {spent.toLocaleString("id-ID")} {limit ? `/ Rp ${limit.toLocaleString("id-ID")}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1 bg-sky-blue border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 bg-baby-pink border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div id="tour-recent-activity" className={`flex flex-col gap-3 border-t-2 border-black pt-4 transition-all ${tourActive && tourStep === 4 ? "border-4 border-white p-2 bg-white/5 animate-pulse rounded-lg" : ""}`}>
        <div className="flex flex-col gap-2.5">
          <h3 className="font-cinzel font-bold text-md text-white text-left">Recent Activity</h3>
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="w-full">
              <BrutalistSelect
                value={recentFilter}
                onChange={(val) => {
                  setRecentFilter(val as any);
                  setRecentPage(1);
                }}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "day", label: "1 Day" },
                  { value: "week", label: "Last 7 Days" },
                  { value: "this_month", label: "This Month" },
                  { value: "month", label: "Last 1 Month" },
                  { value: "3months", label: "Last 3 Months" },
                  { value: "6months", label: "Last 6 Months" },
                  { value: "year", label: "Last Year" },
                  { value: "custom", label: "📅 Custom" },
                ]}
              />
            </div>
            <div className="w-full">
              <BrutalistSelect
                value={recentCategory}
                onChange={(val) => {
                  setRecentCategory(val);
                  setRecentPage(1);
                }}
                options={[
                  { value: "all", label: "All Categories" },
                  ...categoriesList.map((c) => ({
                    value: c.name,
                    label: `${getCategoryEmoji(c.icon)} ${c.name}`,
                  })),
                  { value: "transfers", label: "🔄 Transfers" },
                ]}
              />
            </div>
          </div>
        </div>

        {recentFilter === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 border-2 border-black bg-zinc-950 shadow-[2px_2px_0px_#000]">
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[10px] font-bold text-zinc-300">Start Date</label>
              <input
                type="date"
                value={recentStartDate}
                onChange={(e) => {
                  setRecentStartDate(e.target.value);
                  setRecentPage(1);
                }}
                className="p-1.5 border border-black text-xs bg-zinc-900 text-white outline-none focus:bg-zinc-800 font-mono w-full"
              />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[10px] font-bold text-zinc-300">End Date</label>
              <input
                type="date"
                value={recentEndDate}
                onChange={(e) => {
                  setRecentEndDate(e.target.value);
                  setRecentPage(1);
                }}
                className="p-1.5 border border-black text-xs bg-zinc-900 text-white outline-none focus:bg-zinc-800 font-mono w-full"
              />
            </div>
          </div>
        )}

        {filteredRecentTransactions.length === 0 ? (
          <p className="text-zinc-400 text-xs py-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            {isRecentLoading ? "Loading transactions..." : "No transactions found for the selected filter."}
          </p>
        ) : (
          <>
            <div className={`flex flex-col gap-2 max-h-[265px] overflow-y-auto pr-1 pb-1 transition-opacity ${isRecentLoading ? "opacity-50" : "opacity-100"}`}>
              {filteredRecentTransactions.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="flex items-center justify-between border-2 border-black p-2 bg-zinc-950 text-sm shadow-[1px_1px_0px_#000] text-white cursor-pointer hover:bg-zinc-900 hover:translate-x-0.5 transition-all group"
                  title="Click to view transaction details"
                >
                  <div className="flex items-center gap-2 text-left min-w-0 flex-1">
                    <span className="text-md flex-shrink-0 group-hover:scale-110 transition-transform">
                      {t.type === "expense" ? "🔴" : "🟢"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-bold text-white leading-none text-sm truncate group-hover:text-sky-blue transition-colors"
                        title={t.description || t.categoryName || "Transaction"}
                      >
                        {t.description || t.categoryName || "Transaction"}
                      </p>
                      <p
                        className="text-[10px] text-zinc-400 mt-1 truncate"
                        title={`${t.pocketName}${t.categoryName ? ` • ${t.categoryName}` : ""} • ${formatTransactionDateTime(t.createdAt)}`}
                      >
                        {t.pocketName} {t.categoryName ? `• ${t.categoryName}` : ""} • <span className="font-mono text-zinc-500">{formatTransactionDateTime(t.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-sm ${t.type === "expense" ? "text-red-400" : "text-green-400"} flex-shrink-0 ml-2`}>
                    {t.type === "expense" ? "-" : "+"} Rp {parseFloat(t.amount).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {recentTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5 mt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  disabled={recentPage <= 1 || isRecentLoading}
                  className="px-2.5 py-1 bg-zinc-950 text-zinc-300 border-2 border-black font-cinzel font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-[2px_2px_0px_#000] disabled:cursor-not-allowed cursor-pointer"
                >
                  ◀ PREV
                </button>
                <span className="font-mono text-zinc-400 font-bold text-[10px]">
                  PAGE {recentPage} OF {recentTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.min(recentTotalPages, p + 1))}
                  disabled={recentPage >= recentTotalPages || isRecentLoading}
                  className="px-2.5 py-1 bg-zinc-950 text-zinc-300 border-2 border-black font-cinzel font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-[2px_2px_0px_#000] disabled:cursor-not-allowed cursor-pointer"
                >
                  NEXT ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Button Trigger */}
      <div id="tour-log-expense" className={`w-full flex flex-col gap-3 border-t-2 border-black pt-4 transition-all ${tourActive && tourStep === 3 ? "border-4 border-sky-blue p-2 bg-sky-blue/5 animate-pulse rounded-lg" : ""}`}>
        {pocketsList.length > 0 ? (
          <button
            onClick={() => handleOpenLogTransaction("expense")}
            className={`w-full py-3 bg-baby-pink font-cinzel text-base font-bold border-4 border-black text-dungeon shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${tourActive && tourStep === 3 ? "scale-105" : "animate-bounce"}`}
          >
            LOG AN EXPENSE
          </button>
        ) : (
          <button
            className="w-full py-3 bg-baby-pink font-cinzel text-base font-bold border-4 border-black text-dungeon shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all opacity-60 cursor-not-allowed"
            disabled
            title="Create a pocket first to log expenses."
          >
            LOG AN EXPENSE
          </button>
        )}
      </div>

      {/* Pocket Details & Transactions Modal */}
      {selectedPocket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPocket(null)}
        >
          <div
            className="bg-zinc-950 border-4 border-black shadow-[6px_6px_0px_#000] w-full max-w-md p-4 text-white flex flex-col gap-3.5 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            {(() => {
              const { icon: modalIcon, color: modalColor } = parsePocketIcon(selectedPocket.icon);
              const modalTheme = getPocketTheme(modalColor, 0);

              return (
                <>
                  <div
                    className="-mx-4 -mt-4 h-2 mb-1"
                    style={{ backgroundColor: modalTheme.accent }}
                  />
                  <div className="flex justify-between items-center border-b-2 border-black pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 border-2 border-black rounded flex items-center justify-center text-lg text-black shadow-[1px_1px_0px_#000] flex-shrink-0"
                        style={{ backgroundColor: modalTheme.accent }}
                      >
                        {getPocketEmoji(modalIcon)}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <h3 className="font-cinzel font-bold text-sm truncate max-w-[240px]">
                          {selectedPocket.name}
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-mono capitalize">
                          {selectedPocket.isGoal ? "Saving Goal Pocket" : selectedPocket.isLocked ? "Locked Pocket" : "Wallet Pocket"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPocket(null)}
                      className="w-7 h-7 bg-baby-pink border-2 border-black text-black font-bold flex items-center justify-center shadow-[1px_1px_0px_#000] hover:bg-pink-300 cursor-pointer flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Pocket Overview Card */}
            <div className="border-2 border-black bg-zinc-900 p-3 shadow-[2px_2px_0px_#000] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  Current Balance
                </span>
                {selectedPocket.isLocked && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 text-zinc-300 font-bold rounded">
                    🔒 Locked
                  </span>
                )}
              </div>
              <span className="font-vt323 text-3xl text-sky-blue leading-none">
                Rp {parseFloat(selectedPocket.balance || "0").toLocaleString("id-ID")}
              </span>

              {selectedPocket.isGoal && selectedPocket.targetAmount && (
                <div className="mt-1 pt-2 border-t border-zinc-800 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Target: Rp {parseFloat(selectedPocket.targetAmount).toLocaleString("id-ID")}</span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.max(0, (parseFloat(selectedPocket.balance) / parseFloat(selectedPocket.targetAmount)) * 100)).toFixed(0)}%
                    </span>
                  </div>
                  {selectedPocket.targetDate && (
                    <span className="text-[10px] text-zinc-400">
                      Target Date: 📅 {new Date(selectedPocket.targetDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Transactions Section */}
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <div className="flex justify-between items-center text-xs px-0.5">
                <span className="font-cinzel font-bold text-zinc-200">Pocket Transactions</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  {pocketTransactions.length} recorded
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[260px]">
                {isLoadingPocketTrans ? (
                  <p className="text-zinc-400 text-xs py-8 text-center bg-zinc-900 border-2 border-black border-dashed">
                    Loading transactions...
                  </p>
                ) : pocketTransactions.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-8 text-center bg-zinc-900 border-2 border-black border-dashed">
                    No transactions recorded for this pocket yet.
                  </p>
                ) : (
                  pocketTransactions.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTransaction(t)}
                      className="flex items-center justify-between border-2 border-black p-2 bg-zinc-900 text-sm shadow-[1px_1px_0px_#000] cursor-pointer hover:bg-zinc-800 hover:translate-x-0.5 transition-all"
                      title="Click to view details"
                    >
                      <div className="flex items-center gap-2 text-left min-w-0 flex-1">
                        <span className="text-sm flex-shrink-0">
                          {t.type === "expense" ? "🔴" : "🟢"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">
                            {t.description || t.categoryName || "Transaction"}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {t.categoryName ? `${getCategoryEmoji(t.categoryIcon)} ${t.categoryName} • ` : ""}
                            <span className="font-mono text-zinc-500">{formatTransactionDateTime(t.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-xs ${t.type === "expense" ? "text-red-400" : "text-green-400"} flex-shrink-0 ml-2`}>
                        {t.type === "expense" ? "-" : "+"} Rp {parseFloat(t.amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-2 border-t-2 border-black">
              <button
                onClick={() => {
                  const p = selectedPocket;
                  setSelectedPocket(null);
                  handleOpenEditPocket(p);
                }}
                className="flex-1 py-1.5 bg-yellow-400 border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
              >
                ✏️ EDIT POCKET
              </button>
              <button
                onClick={() => setSelectedPocket(null)}
                className="flex-1 py-1.5 bg-zinc-800 border-2 border-black text-white text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="bg-zinc-950 border-4 border-black shadow-[6px_6px_0px_#000] w-full max-w-sm p-4 text-white flex flex-col gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h3 className="font-cinzel font-bold text-sm text-white">
                📜 Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-7 h-7 bg-baby-pink border-2 border-black text-black font-bold flex items-center justify-center shadow-[1px_1px_0px_#000] hover:bg-pink-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Amount Header Card - Light/Soft Background */}
            <div className={`border-2 border-black p-4 flex flex-col items-center justify-center text-center shadow-[2px_2px_0px_#000] ${
              selectedTransaction.type === "expense" 
                ? "bg-rose-500/10 border-rose-500/30" 
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border rounded-full mb-1.5 ${
                selectedTransaction.type === "expense" 
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300" 
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  selectedTransaction.type === "expense" ? "bg-rose-400" : "bg-emerald-400"
                }`} />
                {selectedTransaction.type === "expense" ? "Expense" : "Income"}
              </span>
              <span className={`font-mono font-extrabold text-2xl mt-0.5 ${
                selectedTransaction.type === "expense" ? "text-rose-300" : "text-emerald-300"
              }`}>
                {selectedTransaction.type === "expense" ? "-" : "+"} Rp {parseFloat(selectedTransaction.amount).toLocaleString("id-ID")}
              </span>
            </div>

            {/* Detail Rows */}
            <div className="border-2 border-black bg-zinc-900 p-3 shadow-[2px_2px_0px_#000] flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-start gap-2 border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 font-bold">Description</span>
                <span className="font-bold text-white text-right break-words max-w-[200px]">
                  {selectedTransaction.description || "-"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 font-bold">Category</span>
                <span className="text-white text-right">
                  {selectedTransaction.categoryName
                    ? `${getCategoryEmoji(selectedTransaction.categoryIcon)} ${selectedTransaction.categoryName}`
                    : "🔄 Transfer / Uncategorized"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 font-bold">Pocket</span>
                <span className="text-white text-right font-medium">
                  💼 {selectedTransaction.pocketName || "-"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 font-bold">Date & Time</span>
                <span className="font-mono text-zinc-300 text-right text-[11px]">
                  {formatTransactionDateTime(selectedTransaction.createdAt)}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedTransaction(null)}
              className="w-full py-2 bg-sky-blue border-2 border-black text-black font-cinzel text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer mt-1"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
