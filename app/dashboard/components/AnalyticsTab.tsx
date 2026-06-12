import React, { useState } from "react";
import BrutalistSelect from "@/components/BrutalistSelect";
import { getCategoryEmoji } from "./LogsTab";

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

interface AnalyticsTabProps {
  pocketsList: Pocket[];
  categoriesList: Category[];
  transactionsList: Transaction[];
  totalBalance: number;
}

export default function AnalyticsTab({
  pocketsList,
  categoriesList,
  transactionsList,
  totalBalance,
}: AnalyticsTabProps) {
  // Filters State for Analytics
  const [filterTime, setFilterTime] = useState<"day" | "week" | "month" | "year" | "all">("month");
  const [filterPocket, setFilterPocket] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  // --- Filtering & Calculations for Analytics Tab ---
  const filteredTransactions = transactionsList.filter((t) => {
    // 1. Filter Time
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
    const isWithinTime = filterTime === "all" || new Date(t.createdAt) >= dateLimit;

    // 2. Filter Pocket
    const isMatchingPocket = filterPocket === "all" || t.pocketName === filterPocket;

    // 3. Filter Category
    const isMatchingCategory = filterCategory === "all" || t.categoryName === filterCategory;

    // 4. Filter Type
    const isMatchingType = filterType === "all" || t.type === filterType;

    return isWithinTime && isMatchingPocket && isMatchingCategory && isMatchingType;
  });

  // Sum total income & expense inside filtered list
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Sum spending per category inside filtered list
  const filteredCategorySpentMap = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((map, t) => {
      if (t.categoryName) {
        map[t.categoryName] = (map[t.categoryName] || 0) + parseFloat(t.amount);
      }
      return map;
    }, {} as Record<string, number>);

  // Compute Balance history trend line
  const computeManaCurveData = () => {
    if (filteredTransactions.length === 0) return [];
    
    // Sort chronologically ascending
    const chronological = [...filteredTransactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let rollingBalance = 0;
    const balancePoints = chronological.map((t) => {
      if (t.type === "income") {
        rollingBalance += parseFloat(t.amount);
      } else {
        rollingBalance -= parseFloat(t.amount);
      }
      return {
        date: new Date(t.createdAt),
        balance: rollingBalance,
      };
    });

    return balancePoints;
  };

  const manaPoints = computeManaCurveData();

  // Generate SVG path for Mana Curve Line Chart
  const renderManaCurveSvg = () => {
    if (manaPoints.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center border-4 border-black bg-zinc-950 border-dashed text-zinc-400 text-xs">
          🔒 Add more transactions to draw balance trend
        </div>
      );
    }

    const minBalance = Math.min(...manaPoints.map((p) => p.balance));
    const maxBalance = Math.max(...manaPoints.map((p) => p.balance));
    const range = maxBalance - minBalance || 1;

    // Viewbox dimensions: 300x120
    const width = 300;
    const height = 120;
    const padding = 12;
    const leftPadding = 60; // Extra room for vertical nominal text on the left
    const rightPadding = 12;

    const coords = manaPoints.map((p, index) => {
      const x = leftPadding + (index / (manaPoints.length - 1)) * (width - leftPadding - rightPadding);
      const y = padding + (1 - (p.balance - minBalance) / range) * (height - 2 * padding);
      return { x, y };
    });

    const pathData = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const areaData = `${pathData} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padding} L ${coords[0].x.toFixed(1)} ${height - padding} Z`;

    const startYear = manaPoints[0].date.getFullYear();
    const endYear = manaPoints[manaPoints.length - 1].date.getFullYear();
    const yearLabel = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;

    const formatDateLabel = (date: Date) => {
      return date.toLocaleDateString("en-US", { day: "numeric", month: "short" }); // e.g. "12 Jun"
    };

    const formatYAxisLabel = (value: number) => {
      const absVal = Math.abs(value);
      let sign = value < 0 ? "-" : "";
      if (absVal >= 1_000_000) {
        return `${sign}Rp ${(absVal / 1_000_000).toFixed(1)}M`;
      }
      if (absVal >= 1_000) {
        return `${sign}Rp ${(absVal / 1_000).toFixed(0)}K`;
      }
      return `${sign}Rp ${absVal.toFixed(0)}`;
    };

    return (
      <div className="flex flex-col gap-2">
        {/* Top Year Indicator */}
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Balance History</span>
          <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 border border-black rounded font-mono font-bold">
            {yearLabel}
          </span>
        </div>

        <div className="border-4 border-black p-3 bg-zinc-950 shadow-[3px_3px_0px_#000]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Grid lines */}
            <line x1={leftPadding} y1={padding} x2={width - rightPadding} y2={padding} stroke="#27272a" strokeWidth="2" strokeDasharray="3,3" />
            <line x1={leftPadding} y1={height / 2} x2={width - rightPadding} y2={height / 2} stroke="#27272a" strokeWidth="2" strokeDasharray="3,3" />
            <line x1={leftPadding} y1={height - padding} x2={width - rightPadding} y2={height - padding} stroke="#000" strokeWidth="2" />

            {/* Y-Axis Nominal Labels */}
            <text x="5" y={padding + 3} fill="#a1a1aa" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              {formatYAxisLabel(maxBalance)}
            </text>
            <text x="5" y={height / 2 + 3} fill="#a1a1aa" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              {formatYAxisLabel((maxBalance + minBalance) / 2)}
            </text>
            <text x="5" y={height - padding + 3} fill="#a1a1aa" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              {formatYAxisLabel(minBalance)}
            </text>

            {/* Area Fill */}
            <path d={areaData} fill="#87CEEB" fillOpacity="0.15" />

            {/* Hard Path Line */}
            <path d={pathData} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />

            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r="4"
                fill="#FFB6C1"
                stroke="#000"
                strokeWidth="2"
                className="trend-point cursor-pointer"
              >
                <title>{`Bal: Rp ${manaPoints[i].balance.toLocaleString("id-ID")}`}</title>
              </circle>
            ))}
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-400 font-mono px-1">
          <span style={{ paddingLeft: `${leftPadding - 8}px` }}>{formatDateLabel(manaPoints[0].date)}</span>
          <span>{formatDateLabel(manaPoints[manaPoints.length - 1].date)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      
      {/* Analytics Filters Control Panel */}
      <div className="border-4 border-black p-3 bg-zinc-950 flex flex-col gap-2.5 shadow-[3px_3px_0px_#000] text-white">
        <h4 className="font-cinzel font-bold text-sm border-b border-black pb-1">🔮 Filter Transactions</h4>
        
        {/* Time range buttons */}
        <div className="flex gap-1">
          {(["day", "week", "month", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterTime(r)}
              className={`flex-1 py-1.5 border border-black text-xs font-bold uppercase ${
                filterTime === r ? "bg-sky-blue text-dungeon" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>

        {/* Pocket & Category selection */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-zinc-400 mb-0.5">Pocket</span>
            <BrutalistSelect
              value={filterPocket}
              onChange={(val) => setFilterPocket(val)}
              options={[
                { value: "all", label: "All Pockets" },
                ...pocketsList.map((p) => ({ value: p.name, label: p.name })),
              ]}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-400 mb-0.5">Category</span>
            <BrutalistSelect
              value={filterCategory}
              onChange={(val) => setFilterCategory(val)}
              options={[
                { value: "all", label: "All Categories" },
                ...categoriesList.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* 1. The Mana Curve */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-cinzel font-bold text-xs text-white">📈 Balance Trend</h4>
        {renderManaCurveSvg()}
      </div>

      {/* 2. Gold Coins Gathered vs Spent */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-cinzel font-bold text-xs text-white">📊 Income vs Expense Ratio</h4>
        <div className="grid grid-cols-2 gap-4 border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000]">
          {/* Income Pillar */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-24 bg-zinc-800 border-2 border-black flex flex-col justify-end overflow-hidden relative shadow-[1px_1px_0px_#000]">
              <div 
                className="bg-green-500 w-full transition-all duration-500" 
                style={{ 
                  height: totalFilteredIncome + totalFilteredExpense > 0 
                    ? `${(totalFilteredIncome / (totalFilteredIncome + totalFilteredExpense)) * 100}%` 
                    : "0%" 
                }} 
              />
            </div>
            <div className="text-center leading-none">
              <span className="text-xs font-bold text-green-400 block">INCOME</span>
              <span className="font-vt323 text-sm text-white">Rp {totalFilteredIncome.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Expense Pillar */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-24 bg-zinc-800 border-2 border-black flex flex-col justify-end overflow-hidden relative shadow-[1px_1px_0px_#000]">
              <div 
                className="bg-red-500 w-full transition-all duration-500" 
                style={{ 
                  height: totalFilteredIncome + totalFilteredExpense > 0 
                    ? `${(totalFilteredExpense / (totalFilteredIncome + totalFilteredExpense)) * 100}%` 
                    : "0%" 
                }} 
              />
            </div>
            <div className="text-center leading-none">
              <span className="text-xs font-bold text-red-400 block">EXPENSE</span>
              <span className="font-vt323 text-sm text-white">Rp {totalFilteredExpense.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Spending by Category */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-cinzel font-bold text-xs text-white">📔 Spending by Category</h4>
        <div className="border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000] flex flex-col gap-3.5">
          {categoriesList.length === 0 ? (
            <span className="text-xs text-zinc-400">No categories found.</span>
          ) : (
            categoriesList.map((cat) => {
              const spent = filteredCategorySpentMap[cat.name] || 0;
              const limit = cat.budgetLimit ? parseFloat(cat.budgetLimit) : null;
              
              let percentage = 0;
              if (limit) {
                percentage = Math.min((spent / limit) * 100, 100);
              } else if (totalFilteredExpense > 0) {
                percentage = (spent / totalFilteredExpense) * 100;
              }

              let barColor = "bg-green-500";
              if (limit && spent > limit) {
                barColor = "bg-red-500 animate-pulse";
              } else if (limit && spent >= limit * 0.8) {
                barColor = "bg-amber-500";
              }

              return (
                <div key={cat.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>{getCategoryEmoji(cat.icon)} {cat.name}</span>
                    <span>Rp {spent.toLocaleString("id-ID")} {limit ? `/ Rp ${limit.toLocaleString("id-ID")}` : ""}</span>
                  </div>
                  <div className="w-full h-4 bg-zinc-900 border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000]">
                    <div className={`${barColor} h-full transition-all duration-300`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Pocket Duel */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-cinzel font-bold text-xs text-white">💼 Balance by Pocket</h4>
        <div className="border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000] flex flex-col gap-3">
          {pocketsList.map((pocket) => {
            const balanceVal = parseFloat(pocket.balance);
            const share = totalBalance > 0 ? (balanceVal / totalBalance) * 100 : 0;
            return (
              <div key={pocket.id} className="flex flex-col gap-1 text-white">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{pocket.name}</span>
                  <span>{share.toFixed(0)}% (Rp {balanceVal.toLocaleString("id-ID")})</span>
                </div>
                <div className="w-full h-4 bg-zinc-900 border-2 border-black overflow-hidden shadow-[1px_1px_0px_#000]">
                  <div className="bg-sky-blue h-full transition-all duration-300" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
