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

export const POCKET_COLOR_OPTIONS = [
  { id: "blue", label: "Sky Blue", accent: "#38bdf8", bg: "bg-sky-500/10", border: "border-sky-400" },
  { id: "gold", label: "Sun Gold", accent: "#facc15", bg: "bg-amber-500/10", border: "border-amber-400" },
  { id: "green", label: "Emerald", accent: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-400" },
  { id: "pink", label: "Rose Pink", accent: "#f472b6", bg: "bg-pink-500/10", border: "border-pink-400" },
  { id: "purple", label: "Mystic Purple", accent: "#c084fc", bg: "bg-purple-500/10", border: "border-purple-400" },
  { id: "orange", label: "Coral Orange", accent: "#fb923c", bg: "bg-orange-500/10", border: "border-orange-400" },
] as const;

export interface PocketColorTheme {
  id: string;
  label: string;
  accent: string;
  bg: string;
  border: string;
  isCustom?: boolean;
}

export function getPocketTheme(color?: string | null, fallbackIndex: number = 0): PocketColorTheme {
  if (!color) {
    return POCKET_COLOR_OPTIONS[fallbackIndex % POCKET_COLOR_OPTIONS.length];
  }
  const found = POCKET_COLOR_OPTIONS.find((c) => c.id === color);
  if (found) return found;

  // Custom Hex color (e.g., "#ff0055" or "ff0055")
  if (color.startsWith("#") || /^[0-9A-Fa-f]{6}$/.test(color)) {
    const hex = color.startsWith("#") ? color : `#${color}`;
    return {
      id: hex,
      label: "Custom",
      accent: hex,
      bg: "bg-zinc-800",
      border: "border-zinc-700",
      isCustom: true,
    };
  }

  return POCKET_COLOR_OPTIONS[fallbackIndex % POCKET_COLOR_OPTIONS.length];
}

export function parsePocketIcon(iconStr?: string | null, fallbackIndex: number = 0) {
  const COLOR_KEYS = ["blue", "gold", "green", "pink", "purple", "orange"] as const;
  if (!iconStr) {
    return {
      icon: "wallet",
      color: COLOR_KEYS[fallbackIndex % COLOR_KEYS.length],
    };
  }
  const parts = iconStr.split(":");
  const icon = parts[0] || "wallet";
  const color = parts[1] || COLOR_KEYS[fallbackIndex % COLOR_KEYS.length];
  return { icon, color };
}

export function getPocketEmoji(icon: string) {
  switch (icon) {
    case "wallet": return "💼";
    case "cash": return "🪙";
    case "bank": return "🏦";
    case "target": return "🎯";
    case "shopping": return "🛍️";
    case "card": return "💳";
    case "travel": return "✈️";
    case "vault": return "🔐";
    default: return "💼";
  }
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
  const { icon: currentIcon, color: currentColor } = parsePocketIcon(pocketIcon);
  const selectedTheme = getPocketTheme(currentColor);
  const isCustomColor = currentColor.startsWith("#") || !POCKET_COLOR_OPTIONS.some((c) => c.id === currentColor);
  const [hexInputValue, setHexInputValue] = React.useState(isCustomColor ? currentColor.replace("#", "") : "");

  React.useEffect(() => {
    if (isCustomColor) {
      setHexInputValue(currentColor.replace("#", ""));
    } else {
      setHexInputValue("");
    }
  }, [currentColor, isCustomColor]);

  const handleSelectIcon = (newIcon: string) => {
    setPocketIcon(`${newIcon}:${currentColor}`);
  };

  const handleSelectColor = (newColor: string) => {
    setPocketIcon(`${currentIcon}:${newColor}`);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="border-4 border-black p-4 bg-zinc-900 flex flex-col gap-3 shadow-[4px_4px_0px_#000] relative text-white">
      <h3 className="font-cinzel font-bold text-md text-white border-b-2 border-black pb-1">
        {isCreatingPocket ? "🆕 Create New Pocket" : "✏️ Edit Pocket"}
      </h3>

      {/* Live Visual Card Preview */}
      <div className="flex flex-col gap-1 items-center bg-zinc-950 border-2 border-black p-3 shadow-[2px_2px_0px_#000]">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
          Live Card Preview
        </span>
        <div className="relative w-full max-w-[210px] border-4 border-black p-3 bg-zinc-900 shadow-[3px_3px_0px_#000] overflow-hidden text-white flex flex-col justify-between min-h-[110px] select-none">
          {/* Top theme accent stripe */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: selectedTheme.accent }}
          />
          <div className="flex items-start justify-between w-full mt-0.5">
            <div 
              className="w-8 h-8 border-2 border-black rounded flex items-center justify-center text-base shadow-[1px_1px_0px_#000]"
              style={{ backgroundColor: selectedTheme.accent, color: "#000" }}
            >
              {getPocketEmoji(currentIcon)}
            </div>
            <div className="flex items-center gap-1">
              {isLocked && <span className="text-[9px] bg-zinc-800 border border-zinc-700 px-1 py-0.5 rounded">🔒</span>}
              {isGoal && <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1 py-0.5 rounded">🎯</span>}
            </div>
          </div>
          <div className="flex flex-col text-left mt-2">
            <h4 className="font-bold text-white text-xs truncate">
              {pocketName.trim() || "Pocket Name"}
            </h4>
            {(isGoal || isLocked) && (
              <span className="text-[9px] text-zinc-400 font-mono">
                {isGoal ? "Saving Goal" : "Locked Fund"}
              </span>
            )}
            <span className="font-mono font-bold text-xs text-white mt-1">
              Rp {parseFloat(pocketBalance || "0").toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>
      
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

      {/* Pocket Icon Selection */}
      <div className="flex flex-col gap-1 text-left">
        <label className="text-xs font-bold text-zinc-300">Pocket Icon</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "wallet", label: "💼 Wallet" },
            { id: "cash", label: "🪙 Cash" },
            { id: "bank", label: "🏦 Bank" },
            { id: "target", label: "🎯 Goal" },
            { id: "shopping", label: "🛍️ Shop" },
            { id: "card", label: "💳 Card" },
            { id: "travel", label: "✈️ Travel" },
            { id: "vault", label: "🔐 Vault" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectIcon(opt.id)}
              className={`py-1.5 border-2 border-black text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 truncate text-center ${currentIcon === opt.id ? "bg-sky-blue text-dungeon" : "bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pocket Color Palette Selection */}
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-zinc-300">Card Color</label>
          {isCustomColor && (
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
              Hex: {selectedTheme.accent}
            </span>
          )}
        </div>

        {/* 6 Presets + 1 Custom Color Picker Tile */}
        <div className="grid grid-cols-7 gap-1.5">
          {POCKET_COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectColor(c.id)}
              className={`h-8 border-2 border-black flex items-center justify-center transition-all cursor-pointer ${
                currentColor === c.id
                  ? "ring-2 ring-white scale-105 shadow-[2px_2px_0px_#fff]"
                  : "opacity-80 hover:opacity-100 shadow-[1px_1px_0px_#000]"
              }`}
              style={{ backgroundColor: c.accent }}
              title={c.label}
            >
              {currentColor === c.id && <span className="text-black text-xs font-extrabold">✓</span>}
            </button>
          ))}

          {/* Custom Color Tile with Native Color Picker */}
          <label
            title="Custom Color (Pick any color)"
            className={`relative h-8 border-2 border-black flex items-center justify-center transition-all cursor-pointer overflow-hidden ${
              isCustomColor
                ? "ring-2 ring-white scale-105 shadow-[2px_2px_0px_#fff]"
                : "opacity-80 hover:opacity-100 shadow-[1px_1px_0px_#000] bg-zinc-800 hover:bg-zinc-700"
            }`}
            style={isCustomColor ? { backgroundColor: selectedTheme.accent } : {}}
          >
            <input
              type="color"
              value={isCustomColor ? selectedTheme.accent : "#a855f7"}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            {isCustomColor ? (
              <span className="text-black text-xs font-extrabold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">✓</span>
            ) : (
              <span className="text-sm select-none" title="Custom color picker">🎨</span>
            )}
          </label>
        </div>

        {/* Custom Hex code input & color button */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-2.5 text-zinc-500 font-mono text-xs">#</span>
            <input
              type="text"
              maxLength={6}
              placeholder="Custom Hex (e.g. A855F7)"
              value={hexInputValue}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
                setHexInputValue(val);
                if (val.length === 6) {
                  handleSelectColor(`#${val}`);
                }
              }}
              className="w-full pl-6 pr-2 py-1 bg-zinc-950 border-2 border-black text-xs font-mono text-white placeholder-zinc-600 outline-none focus:bg-zinc-900 shadow-[1px_1px_0px_#000]"
            />
          </div>
          <label
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border-2 border-black text-xs font-bold text-zinc-200 hover:text-white cursor-pointer shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex-shrink-0"
            title="Open color picker palette"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-black inline-block flex-shrink-0 shadow-[1px_1px_0px_#000]"
              style={{ backgroundColor: selectedTheme.accent }}
            />
            <span className="text-[11px] font-mono">Color Picker</span>
            <input
              type="color"
              value={isCustomColor ? selectedTheme.accent : "#a855f7"}
              onChange={(e) => handleSelectColor(e.target.value)}
              className="sr-only"
            />
          </label>
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
              if (checked && currentIcon === "wallet") {
                handleSelectIcon("target");
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
          className="flex-1 py-2 bg-sky-blue text-dungeon text-xs font-bold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer"
        >
          {isSubmitting ? "SAVING..." : "SAVE POCKET"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-3 bg-zinc-950 text-zinc-300 text-xs font-bold border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
