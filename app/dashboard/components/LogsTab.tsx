import React from "react";
import BrutalistSelect from "@/components/BrutalistSelect";

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

interface LogsTabProps {
  pocketsList: Pocket[];
  categoriesList: Category[];
  transactionsList: Transaction[];
  categorySpentMap: Record<string, number>;
  tourActive: boolean;
  tourStep: number;
  handleOpenCreatePocket: () => void;
  handleOpenEditPocket: (pocket: Pocket) => void;
  handleDeletePocket: (id: string) => void;
  handleOpenCreateCategory: () => void;
  handleOpenEditCategory: (category: Category) => void;
  handleDeleteCategory: (id: string) => void;
  handleOpenLogTransaction: (type: "expense" | "income") => void;
  recentFilter: "day" | "week" | "month" | "3months" | "6months" | "year" | "custom" | "all";
  setRecentFilter: (val: "day" | "week" | "month" | "3months" | "6months" | "year" | "custom" | "all") => void;
  recentStartDate: string;
  setRecentStartDate: (val: string) => void;
  recentEndDate: string;
  setRecentEndDate: (val: string) => void;
  recentPage: number;
  setRecentPage: React.Dispatch<React.SetStateAction<number>>;
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
  transactionsList,
  categorySpentMap,
  tourActive,
  tourStep,
  handleOpenCreatePocket,
  handleOpenEditPocket,
  handleDeletePocket,
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
  recentPage,
  setRecentPage,
  filteredRecentTransactions,
  formatTransactionDateTime,
}: LogsTabProps) {
  return (
    <>
      {/* Pocket list */}
      <div id="tour-pockets" className={`flex flex-col gap-3 transition-all ${tourActive && tourStep === 1 ? "border-4 border-sky-blue p-2 bg-sky-blue/5 animate-pulse rounded-lg" : ""}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-cinzel font-bold text-md text-white">Your Pockets</h3>
          <button 
            onClick={handleOpenCreatePocket}
            className={`px-2 py-1 bg-sky-blue border-2 border-black text-dungeon text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${tourActive && tourStep === 1 ? "scale-105" : ""}`}
          >
            + NEW POCKET
          </button>
        </div>
        
        {pocketsList.length === 0 ? (
          <p className="text-zinc-400 text-xs p-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            No pockets created yet. Click "+ NEW POCKET" to get started!
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[235px] overflow-y-auto pr-1 pb-2">
            {pocketsList.map((pocket) => (
              <div 
                key={pocket.id} 
                className="w-full flex items-center justify-between border-4 border-black p-2 bg-zinc-950 shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#000] transition-all text-white"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-sky-blue border-2 border-black rounded flex items-center justify-center text-md text-dungeon shadow-[1px_1px_0px_#000] flex-shrink-0">
                    {pocket.icon === "wallet" ? "💼" : pocket.icon === "cash" ? "🪙" : "🏦"}
                  </div>
                  <div className="text-left min-w-0 flex-1 pr-3">
                    <h4 className="font-bold text-white text-sm truncate" title={pocket.name}>{pocket.name}</h4>
                    <p className="text-xs text-zinc-400 font-mono break-all leading-tight mt-0.5">
                      Rp {parseFloat(pocket.balance).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => handleOpenEditPocket(pocket)}
                    className="p-1 bg-sky-blue border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeletePocket(pocket.id)}
                    className="p-1 bg-baby-pink border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-dungeon"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
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
        <div className="flex justify-between items-center">
          <h3 className="font-cinzel font-bold text-md text-white text-left">Recent Activity</h3>
          <div className="w-36">
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
                { value: "month", label: "Last 1 Month" },
                { value: "3months", label: "Last 3 Months" },
                { value: "6months", label: "Last 6 Months" },
                { value: "year", label: "Last Year" },
                { value: "custom", label: "📅 Custom" },
              ]}
            />
          </div>
        </div>

        {recentFilter === "custom" && (
          <div className="grid grid-cols-2 gap-2 p-2 border-2 border-black bg-zinc-950 rounded-lg">
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[9px] font-bold text-zinc-300">Start Date</label>
              <input
                type="date"
                value={recentStartDate}
                onChange={(e) => {
                  setRecentStartDate(e.target.value);
                  setRecentPage(1);
                }}
                className="p-1 border border-black text-xs bg-zinc-900 text-white outline-none rounded-md focus:bg-zinc-800 font-mono"
              />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[9px] font-bold text-zinc-300">End Date</label>
              <input
                type="date"
                value={recentEndDate}
                onChange={(e) => {
                  setRecentEndDate(e.target.value);
                  setRecentPage(1);
                }}
                className="p-1 border border-black text-xs bg-zinc-900 text-white outline-none rounded-md focus:bg-zinc-800 font-mono"
              />
            </div>
          </div>
        )}

        {filteredRecentTransactions.length === 0 ? (
          <p className="text-zinc-400 text-xs py-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            No transactions found for the selected filter.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2 max-h-[265px] overflow-y-auto pr-1 pb-1">
              {filteredRecentTransactions
                .slice((recentPage - 1) * 5, recentPage * 5)
                .map((t) => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between border-2 border-black p-2 bg-zinc-950 text-sm shadow-[1px_1px_0px_#000] text-white"
                  >
                    <div className="flex items-center gap-2 text-left min-w-0 flex-1">
                      <span className="text-md flex-shrink-0">
                        {t.type === "expense" ? "🔴" : "🟢"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p 
                          className="font-bold text-white leading-none text-sm truncate" 
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
            {filteredRecentTransactions.length > 5 && (
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5 mt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                  disabled={recentPage === 1}
                  className="px-2.5 py-1 bg-zinc-950 text-zinc-300 border-2 border-black font-cinzel font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-[2px_2px_0px_#000] disabled:cursor-not-allowed cursor-pointer"
                >
                  ◀ PREV
                </button>
                <span className="font-mono text-zinc-400 font-bold text-[10px]">
                  PAGE {recentPage} OF {Math.ceil(filteredRecentTransactions.length / 5)}
                </span>
                <button
                  type="button"
                  onClick={() => setRecentPage((p) => Math.min(Math.ceil(filteredRecentTransactions.length / 5), p + 1))}
                  disabled={recentPage === Math.ceil(filteredRecentTransactions.length / 5)}
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
    </>
  );
}
