import React from "react";

export interface Pocket {
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

interface PocketFormProps {
  isCreatingPocket: boolean;
  editingPocket: Pocket | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  pocketName: string;
  setPocketName: (val: string) => void;
  pocketBalance: string;
  setPocketBalance: (val: string) => void;
  pocketIcon: string;
  setPocketIcon: (val: string) => void;
  isGoal: boolean;
  setIsGoal: (val: boolean) => void;
  targetAmount: string;
  setTargetAmount: (val: string) => void;
  targetDate: string;
  setTargetDate: (val: string) => void;
  isLocked: boolean;
  setIsLocked: (val: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function PocketForm({
  isCreatingPocket,
  editingPocket,
  onSubmit,
  onCancel,
  pocketName,
  setPocketName,
  pocketBalance,
  setPocketBalance,
  pocketIcon,
  setPocketIcon,
  isGoal,
  setIsGoal,
  targetAmount,
  setTargetAmount,
  targetDate,
  setTargetDate,
  isLocked,
  setIsLocked,
  isSubmitting,
  error,
}: PocketFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="border-4 border-black p-4 bg-zinc-900 flex flex-col gap-3 shadow-[4px_4px_0px_#000] relative text-white">
      <h3 className="font-cinzel font-bold text-md text-white border-b-2 border-black pb-1">
        {isCreatingPocket ? "🆕 Create New Pocket" : "✏️ Edit Pocket"}
      </h3>
      
      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Pocket Name</label>
        <input 
          type="text" 
          value={pocketName} 
          onChange={(e) => setPocketName(e.target.value)}
          placeholder="e.g. Vacation Savings, Cash, Bank BRI" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900"
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">
          {isCreatingPocket ? "Starting Balance (Rp)" : "Balance (Rp)"}
        </label>
        <input 
          type="number" 
          step="0.01"
          value={pocketBalance} 
          onChange={(e) => setPocketBalance(e.target.value)}
          placeholder="0.00" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900 font-mono"
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Pocket Icon</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "wallet", label: "💼 Wallet" },
            { id: "cash", label: "🪙 Cash" },
            { id: "bank", label: "🏦 Bank" },
            { id: "target", label: "🎯 Goal" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPocketIcon(opt.id)}
              className={`py-1.5 border-2 border-black text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${pocketIcon === opt.id ? "bg-sky-blue text-dungeon" : "bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Menabung (Saving Goal) Section */}
      <div className="border-2 border-black bg-zinc-950 p-3 flex flex-col gap-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isGoal}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsGoal(checked);
              if (checked && pocketIcon === "wallet") {
                setPocketIcon("target");
              }
              if (!checked) {
                setIsLocked(false);
              }
            }}
            className="w-4 h-4 accent-amber-400 cursor-pointer"
          />
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
            🎯 Set as Saving Goal Pocket
          </span>
        </label>

        {isGoal && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-800">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[11px] font-bold text-zinc-300">
                Target Amount (Rp) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="e.g. 500000"
                className="p-2 border-2 border-black text-sm bg-zinc-900 text-amber-300 outline-none font-mono focus:border-amber-400"
                required={isGoal}
              />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-300">Target Date (Optional)</label>
                {targetDate && (
                  <button
                    type="button"
                    onClick={() => setTargetDate("")}
                    className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </div>
              <input
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="p-1.5 border-2 border-black text-xs bg-zinc-900 text-white outline-none focus:border-amber-400"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                🔒 Lock Pocket (Prevent expense logging / outgoing transfers)
              </span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs font-bold text-red-400 border-2 border-black bg-red-950/40 p-2">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2 bg-sky-blue text-dungeon text-xs font-bold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isSubmitting ? "SAVING..." : "SAVE POCKET"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-3 bg-zinc-950 text-zinc-300 text-xs font-bold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
