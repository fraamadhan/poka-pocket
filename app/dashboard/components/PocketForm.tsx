import React from "react";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
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
          placeholder="e.g. Cash, BRI, Mandiri" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900"
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Balance (Rp)</label>
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
        <div className="flex gap-2">
          {[
            { id: "wallet", label: "💼 E-Wallet" },
            { id: "cash", label: "🪙 Cash" },
            { id: "bank", label: "🏦 Bank" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPocketIcon(opt.id)}
              className={`flex-1 py-1.5 border-2 border-black text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${pocketIcon === opt.id ? "bg-sky-blue text-dungeon" : "bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
