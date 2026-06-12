import React from "react";

interface Category {
  id: string;
  name: string;
  budgetLimit: string | null;
  icon: string;
  createdAt: Date;
}

interface CategoryFormProps {
  isCreatingCategory: boolean;
  editingCategory: Category | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  categoryName: string;
  setCategoryName: (val: string) => void;
  categoryBudget: string;
  setCategoryBudget: (val: string) => void;
  categoryIcon: string;
  setCategoryIcon: (val: string) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function CategoryForm({
  isCreatingCategory,
  editingCategory,
  onSubmit,
  onCancel,
  categoryName,
  setCategoryName,
  categoryBudget,
  setCategoryBudget,
  categoryIcon,
  setCategoryIcon,
  isSubmitting,
  error,
}: CategoryFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="border-4 border-black p-4 bg-zinc-900 flex flex-col gap-3 shadow-[4px_4px_0px_#000] relative text-white">
      <h3 className="font-cinzel font-bold text-md text-white border-b-2 border-black pb-1">
        {isCreatingCategory ? "🆕 Create New Category" : "✏️ Edit Category"}
      </h3>
      
      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Category Name</label>
        <input 
          type="text" 
          value={categoryName} 
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="e.g. Snacks, Food, Games" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900"
          required
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          Monthly Budget Limit (Rp, Optional)
          <span 
            className="cursor-help text-zinc-400 hover:text-white transition-colors" 
            title="This limit resets automatically on the 1st of every month."
          >
            ℹ️
          </span>
        </label>
        <input 
          type="number" 
          step="0.01"
          value={categoryBudget} 
          onChange={(e) => setCategoryBudget(e.target.value)}
          placeholder="No limit" 
          className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900 font-mono"
        />
      </div>

      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Category Icon</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "burger", label: "🍔 Food" },
            { id: "car", label: "🚗 Travel" },
            { id: "gift", label: "🎁 Gift" },
            { id: "bill", label: "💵 Bill" },
            { id: "game", label: "🎮 Game" },
            { id: "scroll", label: "📚 Study" },
            { id: "shopping", label: "🛍️ Shop" },
            { id: "coffee", label: "☕ Cafe" },
            { id: "popcorn", label: "🍿 Fun" },
            { id: "heart", label: "❤️ Care" },
            { id: "laptop", label: "💻 Tech" },
            { id: "home", label: "🏠 Rent" },
            { id: "shirt", label: "👕 Other" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategoryIcon(opt.id)}
              className={`py-1.5 border-2 border-black text-[11px] font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${categoryIcon === opt.id ? "bg-sky-blue text-dungeon" : "bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
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
          {isSubmitting ? "SAVING..." : "SAVE CATEGORY"}
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
