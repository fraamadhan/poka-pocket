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

interface TransactionFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  transType: "expense" | "income";
  setTransType: (type: "expense" | "income") => void;
  transAmount: string;
  setTransAmount: React.Dispatch<React.SetStateAction<string>>;
  transPocketId: string;
  setTransPocketId: (val: string) => void;
  transCategoryId: string;
  setTransCategoryId: (val: string) => void;
  transDescription: string;
  setTransDescription: (val: string) => void;
  pocketsList: Pocket[];
  categoriesList: Category[];
  isSubmitting: boolean;
  error: string | null;
}

export default function TransactionForm({
  onSubmit,
  onCancel,
  transType,
  setTransType,
  transAmount,
  setTransAmount,
  transPocketId,
  setTransPocketId,
  transCategoryId,
  setTransCategoryId,
  transDescription,
  setTransDescription,
  pocketsList,
  categoriesList,
  isSubmitting,
  error,
}: TransactionFormProps) {
  const numpadKeys = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    ".", "0", "⌫"
  ];

  const handleKeyPress = (key: string) => {
    if (key === "⌫") {
      setTransAmount((prev) => prev.slice(0, -1));
    } else if (key === ".") {
      setTransAmount((prev) => {
        if (prev.includes(".")) return prev;
        if (prev === "") return "0.";
        return prev + ".";
      });
    } else {
      setTransAmount((prev) => {
        if (prev === "0" && key === "0") return prev;
        if (prev === "0" && key !== "0") return key;
        return prev + key;
      });
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="border-4 border-black p-4 bg-zinc-900 flex flex-col gap-3 shadow-[4px_4px_0px_#000] relative text-white">
      <h3 className="font-cinzel font-bold text-md text-white border-b-2 border-black pb-1">
        💸 Log Transaction
      </h3>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Transaction Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTransType("expense");
              // Auto-select a pocket with balance > 0 if current selected is empty
              const currentPocket = pocketsList.find((p) => p.id === transPocketId);
              if (!currentPocket || parseFloat(currentPocket.balance) <= 0) {
                const positivePocket = pocketsList.find((p) => parseFloat(p.balance) > 0);
                if (positivePocket) {
                  setTransPocketId(positivePocket.id);
                }
              }
            }}
            className={`flex-1 py-1.5 border-2 border-black text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none ${
              transType === "expense" ? "bg-baby-pink text-dungeon" : "bg-zinc-950 text-zinc-400"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setTransType("income")}
            className={`flex-1 py-1.5 border-2 border-black text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none ${
              transType === "income" ? "bg-sky-blue text-dungeon" : "bg-zinc-950 text-zinc-400"
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Amount (Rp)</label>
        <div className="p-3 border-2 border-black text-lg bg-zinc-950 text-white font-mono flex items-center justify-between min-h-[48px] rounded-none">
          <span>Rp {transAmount || "0.00"}</span>
          {transAmount && (
            <button
              type="button"
              onClick={() => setTransAmount("")}
              className="text-xs bg-red-600 hover:bg-red-700 text-white border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Custom Brutalist Virtual NumPad */}
      <div className="grid grid-cols-3 gap-2 mt-1 bg-zinc-950 p-2 border-2 border-black">
        {numpadKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyPress(key)}
            className={`py-3 border-2 border-black text-sm font-bold font-mono transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              key === "⌫" 
                ? "bg-baby-pink text-dungeon" 
                : key === "." 
                ? "bg-zinc-800 text-white"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Select Pocket</label>
        <BrutalistSelect
          value={transPocketId}
          onChange={(val) => setTransPocketId(val)}
          options={pocketsList.map((p) => {
            const balanceNum = parseFloat(p.balance);
            const isExpense = transType === "expense";
            const isZero = balanceNum <= 0;
            return {
              value: p.id,
              label: `${p.name} (Bal: Rp ${balanceNum.toLocaleString("id-ID")})${isExpense && isZero ? " - [Empty]" : ""}`,
              disabled: isExpense && isZero,
            };
          })}
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Select Category</label>
        <BrutalistSelect
          value={transCategoryId}
          onChange={(val) => setTransCategoryId(val)}
          placeholder="Select Category"
          options={categoriesList.map((c) => ({
            value: c.id,
            label: `${c.name} ${c.budgetLimit ? `(Limit: Rp ${parseFloat(c.budgetLimit).toLocaleString("id-ID")})` : ""}`,
          }))}
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Description (Optional)</label>
        <input 
          type="text" 
          id="trans-desc-input"
          value={transDescription} 
          onChange={(e) => setTransDescription(e.target.value)}
          placeholder="e.g. Siomay, Grab ride, Salary" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900"
        />
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
          {isSubmitting ? "LOGGING..." : "CONFIRM LOG"}
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
