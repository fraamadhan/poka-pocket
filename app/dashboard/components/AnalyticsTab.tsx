import React, { useState, useEffect, useRef } from "react";
import BrutalistSelect from "@/components/BrutalistSelect";
import { getCategoryEmoji } from "./LogsTab";
import { AnalyticsData, getAnalyticsData } from "@/app/actions/transactions";

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

interface AnalyticsTabProps {
  pocketsList: Pocket[];
  categoriesList: Category[];
  totalBalance: number;
  initialAnalyticsData?: AnalyticsData;
  transactionsList?: any;
}

export default function AnalyticsTab({
  pocketsList,
  categoriesList,
  totalBalance,
  initialAnalyticsData,
}: AnalyticsTabProps) {
  // Filters State for Analytics (Processed in Backend)
  const [filterTime, setFilterTime] = useState<"day" | "week" | "this_month" | "month" | "year" | "custom" | "all">("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterPocket, setFilterPocket] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(
    initialAnalyticsData || {
      totalIncome: 0,
      totalExpense: 0,
      categorySpentMap: {},
      manaPoints: [],
    }
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with initialAnalyticsData when it updates from parent
  useEffect(() => {
    if (initialAnalyticsData) {
      setAnalyticsData(initialAnalyticsData);
    }
  }, [initialAnalyticsData]);

  // Fetch updated aggregated analytics from backend whenever filters change
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    let isCancelled = false;
    const fetchAnalytics = async () => {
      setIsUpdating(true);
      const res = await getAnalyticsData({
        filterTime,
        startDate,
        endDate,
        filterPocket,
        filterCategory,
        filterType,
      });

      if (!isCancelled && res.data) {
        setAnalyticsData(res.data);
      }
      setIsUpdating(false);
    };

    fetchAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [filterTime, startDate, endDate, filterPocket, filterCategory, filterType]);

  const totalFilteredIncome = analyticsData.totalIncome;
  const totalFilteredExpense = analyticsData.totalExpense;
  const filteredCategorySpentMap = analyticsData.categorySpentMap;

  // Retro neo-brutalist color palette for category slices
  const PIE_COLORS = [
    "#87CEEB", // sky blue
    "#FFB6C1", // baby pink
    "#FACC15", // yellow
    "#4ADE80", // lime green
    "#FB923C", // orange
    "#C084FC", // purple
    "#F87171", // soft red
    "#2DD4BF", // teal
    "#A78BFA", // violet
    "#F472B6", // rose
    "#60A5FA", // blue
    "#34D399", // emerald
  ];

  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  const getDonutSlicePath = (cx: number, cy: number, r: number, R: number, startAngle: number, endAngle: number) => {
    const outerStart = polarToCartesian(cx, cy, R, startAngle);
    const outerEnd = polarToCartesian(cx, cy, R, endAngle);
    const innerStart = polarToCartesian(cx, cy, r, endAngle);
    const innerEnd = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${R} ${R} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  };

  const getDonutRingPath = (cx: number, cy: number, r: number, R: number) => {
    return [
      `M ${cx} ${cy - R}`,
      `A ${R} ${R} 0 1 0 ${cx} ${cy + R}`,
      `A ${R} ${R} 0 1 0 ${cx} ${cy - R}`,
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
      "Z",
    ].join(" ");
  };

  const renderSpendingPieChart = () => {
    const categoryEntries = Object.entries(filteredCategorySpentMap)
      .filter(([_, spent]) => spent > 0)
      .sort((a, b) => b[1] - a[1]);

    const totalExpenseFromCategories = categoryEntries.reduce((sum, [_, spent]) => sum + spent, 0);

    if (categoryEntries.length === 0 || totalExpenseFromCategories === 0) {
      return (
        <div className="h-40 flex flex-col items-center justify-center border-4 border-black bg-zinc-950 border-dashed text-zinc-400 text-xs p-4 text-center">
          <span>🔒 No expense transactions found for this period.</span>
        </div>
      );
    }

    const cx = 140;
    const cy = 140;
    const innerR = 82;
    const normalOuterR = 120;
    const activeOuterR = 126;

    let currentAngle = 0;
    const sliceData = categoryEntries.map(([name, spent], idx) => {
      const pct = (spent / totalExpenseFromCategories) * 100;
      const angleSpan = (spent / totalExpenseFromCategories) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      const matchedCat = categoriesList.find((c) => c.name.toLowerCase() === name.toLowerCase());
      const emoji = getCategoryEmoji(matchedCat?.icon || null);
      const color = PIE_COLORS[idx % PIE_COLORS.length];

      return {
        name,
        spent,
        pct,
        startAngle,
        endAngle,
        emoji,
        color,
      };
    });

    const activeItem = sliceData.find((s) => s.name === activeCategory);

    return (
      <div className="border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000] flex flex-col gap-4">
        {/* Donut Chart Container */}
        <div className="relative w-full max-w-[280px] aspect-square mx-auto flex items-center justify-center">
          <svg viewBox="0 0 280 280" className="w-full h-full overflow-visible">
            {sliceData.map((slice) => {
              const isSelected = activeCategory === slice.name;
              const outerR = isSelected ? activeOuterR : normalOuterR;
              const pathD =
                sliceData.length === 1 || slice.endAngle - slice.startAngle >= 359.99
                  ? getDonutRingPath(cx, cy, innerR, outerR)
                  : getDonutSlicePath(cx, cy, innerR, outerR, slice.startAngle, slice.endAngle);

              return (
                <path
                  key={slice.name}
                  d={pathD}
                  fill={slice.color}
                  fillRule="evenodd"
                  stroke="#000"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all duration-150"
                  style={{
                    filter: isSelected ? "drop-shadow(0px 0px 6px rgba(255,255,255,0.7))" : undefined,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                  onMouseEnter={() => setActiveCategory(slice.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onClick={() => setActiveCategory((prev) => (prev === slice.name ? null : slice.name))}
                >
                  <title>{`${slice.emoji} ${slice.name}: ${slice.pct.toFixed(1)}% (Rp ${slice.spent.toLocaleString("id-ID")})`}</title>
                </path>
              );
            })}
          </svg>

          {/* Interactive Center Overlay - Spacious inner area without slice overlap */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center select-none">
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold leading-none">
                TOTAL SPENT
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-white mt-1 leading-none">
                Rp {totalFilteredExpense.toLocaleString("id-ID")}
              </span>
            </div>

            {activeItem ? (
              <div className="flex flex-col items-center mt-2 pt-1.5 border-t border-zinc-700/80 animate-in fade-in duration-150 w-full max-w-[140px]">
                <span className="text-xs sm:text-sm font-bold text-yellow-400 truncate max-w-full leading-tight" title={activeItem.name}>
                  {activeItem.emoji} {activeItem.name}
                </span>
                <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] mt-1 leading-none">
                  <span className="text-white font-bold">{activeItem.pct.toFixed(1)}%</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300 font-bold">Rp {activeItem.spent.toLocaleString("id-ID")}</span>
                </div>
              </div>
            ) : (
              <span className="text-[9px] text-zinc-500 mt-1.5 leading-none">
                Hover / Tap slice
              </span>
            )}
          </div>
        </div>

        {/* Legend / Breakdown List - Name on Top, Percent & Nominal on Bottom */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-800">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono px-0.5">
            <span>CATEGORY BREAKDOWN</span>
            <span>PERCENT • NOMINAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {sliceData.map((slice) => {
              const isSelected = activeCategory === slice.name;
              return (
                <button
                  key={slice.name}
                  type="button"
                  onMouseEnter={() => setActiveCategory(slice.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onClick={() => setActiveCategory((prev) => (prev === slice.name ? null : slice.name))}
                  className={`flex flex-col gap-1 p-2 border-2 text-xs transition-all text-left ${
                    isSelected
                      ? "border-white bg-zinc-800 shadow-[2px_2px_0px_#fff]"
                      : "border-black bg-zinc-900 hover:bg-zinc-800 shadow-[1px_1px_0px_#000]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 w-full">
                    <span
                      className="w-3 h-3 border border-black flex-shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate text-white font-bold text-xs" title={slice.name}>
                      {slice.emoji} {slice.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] pl-4.5 w-full">
                    <span className="text-yellow-400 font-bold">{slice.pct.toFixed(1)}%</span>
                    <span className="text-zinc-300 font-medium">Rp {slice.spent.toLocaleString("id-ID")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-5 text-left transition-opacity duration-200 ${isUpdating ? "opacity-60" : "opacity-100"}`}>

      {/* Analytics Filters Control Panel */}
      <div className="border-4 border-black p-3 bg-zinc-950 flex flex-col gap-2.5 shadow-[3px_3px_0px_#000] text-white">
        <h4 className="font-cinzel font-bold text-sm border-b border-black pb-1">🔮 Filter Transactions</h4>

        {/* Time range buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
          {[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "this_month", label: "This Month" },
            { value: "month", label: "30 Days" },
            { value: "year", label: "Year" },
            { value: "all", label: "All Time" },
            { value: "custom", label: "📅 Custom" },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setFilterTime(r.value as any)}
              className={`py-1.5 px-1 border border-black text-xs font-bold uppercase transition-all truncate text-center ${filterTime === r.value
                  ? "bg-sky-blue text-dungeon shadow-[1px_1px_0px_#000]"
                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                } ${r.value === "custom" ? "col-span-3 sm:col-span-2 md:col-span-1" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {filterTime === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border-2 border-black bg-zinc-900 shadow-[2px_2px_0px_#000]">
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[10px] font-bold text-zinc-300">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 border border-black text-xs bg-zinc-950 text-white outline-none focus:bg-zinc-900 font-mono w-full"
              />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <label className="text-[10px] font-bold text-zinc-300">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 border border-black text-xs bg-zinc-950 text-white outline-none focus:bg-zinc-900 font-mono w-full"
              />
            </div>
          </div>
        )}

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

      {/* 1. Spending Breakdown Pie / Donut Chart */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-cinzel font-bold text-xs text-white">🥧 Spending Breakdown</h4>
        {renderSpendingPieChart()}
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
