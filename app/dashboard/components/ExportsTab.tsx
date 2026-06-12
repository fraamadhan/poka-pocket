import React from "react";
import BrutalistSelect from "@/components/BrutalistSelect";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
  createdAt: Date;
}

interface ExportRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: Date;
}

interface ExportsTabProps {
  exportsList: ExportRecord[];
  isExporting: boolean;
  exportRange: "all" | "month" | "week" | "day" | "custom";
  setExportRange: (val: "all" | "month" | "week" | "day" | "custom") => void;
  exportType: "all" | "expense" | "income";
  setExportType: (val: "all" | "expense" | "income") => void;
  exportPocket: string;
  setExportPocket: (val: string) => void;
  exportStartDate: string;
  setExportStartDate: (val: string) => void;
  exportEndDate: string;
  setExportEndDate: (val: string) => void;
  pocketsList: Pocket[];
  onExportTrigger: () => void;
  onDeleteExport: (id: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function ExportsTab({
  exportsList,
  isExporting,
  exportRange,
  setExportRange,
  exportType,
  setExportType,
  exportPocket,
  setExportPocket,
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  pocketsList,
  onExportTrigger,
  onDeleteExport,
  isSubmitting,
  error,
}: ExportsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-4 border-black p-4 bg-zinc-950 shadow-[3px_3px_0px_#000] text-left">
        <h4 className="font-cinzel font-bold text-sm text-white mb-1">
          📤 Export to Excel
        </h4>
        <p className="text-xs text-zinc-400 mb-3 font-sans">
          Generate a spreadsheet (.xlsx) of your transactions with auto-filters, formulas, and visual formatting, securely backed up to Cloudinary.
        </p>
        
        {/* Filters configuration for generation */}
        <div className="flex flex-col gap-2.5 mb-4 border-t-2 border-dashed border-zinc-800 pt-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-zinc-400">Select Timeframe</label>
            <BrutalistSelect
              value={exportRange}
              onChange={(val) => setExportRange(val as any)}
              options={[
                { value: "all", label: "All Time" },
                { value: "month", label: "Last 30 Days" },
                { value: "week", label: "Last 7 Days" },
                { value: "day", label: "Last 24 Hours" },
                { value: "custom", label: "📅 Custom Range" },
              ]}
            />
          </div>

          {exportRange === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-1 p-2 border-2 border-black bg-zinc-900 rounded-lg">
              <div className="flex flex-col gap-0.5 text-left">
                <label className="text-[9px] font-bold text-zinc-300">Start Date</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="p-1 border-2 border-black text-xs bg-zinc-950 text-white outline-none rounded-md focus:bg-zinc-900 font-mono"
                />
              </div>
              <div className="flex flex-col gap-0.5 text-left">
                <label className="text-[9px] font-bold text-zinc-300">End Date</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="p-1 border-2 border-black text-xs bg-zinc-950 text-white outline-none rounded-md focus:bg-zinc-900 font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-zinc-400">Select Transaction Type</label>
            <BrutalistSelect
              value={exportType}
              onChange={(val) => setExportType(val as any)}
              options={[
                { value: "all", label: "All Types" },
                { value: "expense", label: "Expenses Only" },
                { value: "income", label: "Income Only" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-zinc-300">Select Pocket</label>
            <BrutalistSelect
              value={exportPocket}
              onChange={(val) => setExportPocket(val)}
              options={[
                { value: "all", label: "All Pockets" },
                ...pocketsList.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              ]}
            />
          </div>
        </div>

        <button
          onClick={onExportTrigger}
          disabled={isExporting}
          className="w-full py-2 bg-sky-blue text-dungeon font-cinzel text-sm font-extrabold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 cursor-pointer"
        >
          {isExporting ? "GENERATING EXCEL..." : "🚀 EXPORT NOW"}
        </button>
      </div>

      {error && (
        <div className="text-xs font-bold text-red-400 border-2 border-black bg-red-950/40 p-2 text-left">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <h4 className="font-cinzel font-bold text-xs text-white text-left">
          📂 Export History
        </h4>
        {exportsList.length === 0 ? (
          <p className="text-zinc-400 text-xs p-4 bg-zinc-950 border-2 border-black border-dashed text-center">
            No export history found. Export your first spreadsheet above!
          </p>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1 pb-2 scrollbar-brutalist">
            {exportsList.map((exp) => (
              <div
                key={exp.id}
                className="w-full flex items-center justify-between border-4 border-black p-2.5 bg-zinc-950 shadow-[2px_2px_0px_#000] text-white"
              >
                <div className="text-left flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-white text-xs truncate" title={exp.fileName}>
                    {exp.fileName}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono leading-none mt-1">
                    {new Date(exp.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-1.5 items-center">
                  <a
                    href={exp.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-baby-pink border-2 border-black text-dungeon text-[10px] font-bold shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 block whitespace-nowrap text-center cursor-pointer"
                  >
                    DOWNLOAD
                  </a>
                  <button
                    onClick={() => onDeleteExport(exp.id)}
                    disabled={isSubmitting}
                    className="p-1 bg-zinc-800 border border-black shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs text-zinc-300 cursor-pointer disabled:bg-zinc-900 disabled:text-zinc-600"
                    title="Delete export record"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
