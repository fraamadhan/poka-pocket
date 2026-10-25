"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import BrutalistSelect from "@/components/BrutalistSelect";
import { 
  RecurringRuleItem, 
  createRecurringRule, 
  toggleRecurringRule, 
  deleteRecurringRule,
  updateRecurringRule,
  triggerRecurringRuleNow 
} from "@/app/actions/recurring";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
  isLocked?: boolean;
}

interface Category {
  id: string;
  name: string;
  budgetLimit: string | null;
  icon: string;
}

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocketsList: Pocket[];
  categoriesList: Category[];
  recurringList: RecurringRuleItem[];
  onRulesUpdated: (updatedList: RecurringRuleItem[]) => void;
  triggerToast: (msg: string, type?: "error" | "success") => void;
}

export default function RecurringModal({
  isOpen,
  onClose,
  pocketsList,
  categoriesList,
  recurringList,
  onRulesUpdated,
  triggerToast,
}: RecurringModalProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRuleItem | null>(null);

  // Form State
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [pocketId, setPocketId] = useState(pocketsList[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningRuleId, setRunningRuleId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const currentSelectedPocket = pocketsList.find((p) => p.id === pocketId);
  const currentSelectedBalance = currentSelectedPocket ? parseFloat(currentSelectedPocket.balance) : 0;
  const parsedAmountVal = parseFloat(amount.replace(",", ".")) || 0;
  const isBalanceInsufficient = type === "expense" && parsedAmountVal > 0 && currentSelectedBalance < parsedAmountVal;

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingRule(null);
    setDescription("");
    setAmount("");
    setType("expense");
    setFrequency("monthly");
    setPocketId(pocketsList[0]?.id || "");
    setCategoryId("");
    setStartDate(new Date().toLocaleDateString("en-CA"));
    setFormError(null);
    setShowForm(false);
  };

  const startEdit = (rule: RecurringRuleItem) => {
    setEditingRule(rule);
    setType(rule.type);
    setDescription(rule.description);
    setAmount(parseFloat(rule.amount).toString());
    setFrequency(rule.frequency);
    setPocketId(rule.pocketId);
    setCategoryId(rule.categoryId || "");
    
    // Safely format rule.nextRunDate to YYYY-MM-DD
    const dateObj = new Date(rule.nextRunDate);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString("en-CA")
      : new Date().toLocaleDateString("en-CA");
    setStartDate(dateStr);
    
    setFormError(null);
    setShowForm(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!pocketId) {
      setFormError("Please select a target pocket.");
      return;
    }
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      setFormError("Amount must be a valid positive number.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-CA");
    if (startDate && startDate < todayStr) {
      setFormError("Payment date cannot be in the past (must be today or later).");
      return;
    }

    // Verify pocket balance for recurring expenses before submitting
    const selectedPocket = pocketsList.find((p) => p.id === pocketId);
    const currentPocketBalance = selectedPocket ? parseFloat(selectedPocket.balance) : 0;
    if (type === "expense") {
      if (selectedPocket?.isLocked) {
        setFormError(`Pocket "${selectedPocket.name}" is locked. Unlock it before creating an expense rule.`);
        return;
      }
      if (currentPocketBalance < val) {
        setFormError(
          `Insufficient balance in pocket "${selectedPocket?.name || "selected pocket"}". Available: Rp ${currentPocketBalance.toLocaleString("id-ID")}, Required: Rp ${val.toLocaleString("id-ID")}. Please top up the pocket or reduce the amount before submitting.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingRule) {
        // Edit mode
        const res = await updateRecurringRule(editingRule.id, {
          pocketId,
          categoryId: categoryId || null,
          type,
          amount,
          description: description.trim(),
          frequency,
          nextRunDate: startDate,
        });

        if (res.success) {
          const selectedPocket = pocketsList.find((p) => p.id === pocketId);
          const selectedCategory = categoriesList.find((c) => c.id === categoryId);

          const updatedList = recurringList.map((r) =>
            r.id === editingRule.id
              ? {
                  ...r,
                  pocketId,
                  pocketName: selectedPocket?.name || r.pocketName,
                  pocketIcon: selectedPocket?.icon || r.pocketIcon,
                  categoryId: categoryId || null,
                  categoryName: selectedCategory?.name || null,
                  categoryIcon: selectedCategory?.icon || null,
                  type,
                  amount: val.toFixed(2),
                  description: description.trim(),
                  frequency,
                  nextRunDate: new Date(startDate || todayStr),
                }
              : r
          );

          onRulesUpdated(updatedList);
          triggerToast(`Rule "${description.trim()}" updated successfully!`, "success");
          router.refresh();
          resetForm();
        } else {
          setFormError(res.error || "Failed to update recurring rule.");
        }
      } else {
        // Create mode
        const res = await createRecurringRule({
          pocketId,
          categoryId: categoryId || null,
          type,
          amount,
          description: description.trim(),
          frequency,
          startDate,
        });

        if (res.success && res.id) {
          const selectedPocket = pocketsList.find((p) => p.id === pocketId);
          const selectedCategory = categoriesList.find((c) => c.id === categoryId);

          const newRule: RecurringRuleItem = {
            id: res.id,
            userId: "",
            pocketId,
            pocketName: selectedPocket?.name || "Pocket",
            pocketIcon: selectedPocket?.icon || "wallet",
            categoryId: categoryId || null,
            categoryName: selectedCategory?.name || null,
            categoryIcon: selectedCategory?.icon || null,
            type,
            amount: val.toFixed(2),
            description: description.trim(),
            frequency,
            nextRunDate: new Date(startDate || todayStr),
            lastRunDate: null,
            isActive: true,
            createdAt: new Date(),
          };

          onRulesUpdated([newRule, ...recurringList]);
          triggerToast(`Auto rule "${description.trim()}" created successfully!`, "success");
          router.refresh();
          resetForm();
        } else {
          setFormError(res.error || "Failed to create recurring rule.");
        }
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (rule: RecurringRuleItem) => {
    const newStatus = !rule.isActive;
    const res = await toggleRecurringRule(rule.id, newStatus);
    if (res.success) {
      onRulesUpdated(
        recurringList.map((r) => (r.id === rule.id ? { ...r, isActive: newStatus } : r))
      );
      triggerToast(
        `Rule "${rule.description}" ${newStatus ? "resumed" : "paused"}.`,
        "success"
      );
    } else {
      triggerToast(res.error || "Failed to update rule status.", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete auto rule "${name}"?`)) return;
    const res = await deleteRecurringRule(id);
    if (res.success) {
      onRulesUpdated(recurringList.filter((r) => r.id !== id));
      triggerToast(`Rule "${name}" deleted successfully.`, "success");
    } else {
      triggerToast(res.error || "Failed to delete rule.", "error");
    }
  };

  const handleRunNow = async (rule: RecurringRuleItem) => {
    setRunningRuleId(rule.id);
    try {
      const res = await triggerRecurringRuleNow(rule.id);
      if (res.success && res.nextRunDate) {
        onRulesUpdated(
          recurringList.map((r) =>
            r.id === rule.id
              ? {
                  ...r,
                  isActive: true,
                  lastRunDate: new Date(),
                  nextRunDate: new Date(res.nextRunDate!),
                }
              : r
          )
        );
        triggerToast(
          `⚡ Rule "${rule.description}" executed! Next run scheduled for ${new Date(
            res.nextRunDate
          ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
          "success"
        );
        router.refresh();
      } else {
        triggerToast(res.error || "Failed to execute recurring rule now.", "error");
      }
    } catch (err: any) {
      triggerToast(err?.message || "Execution failed.", "error");
    } finally {
      setRunningRuleId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-zinc-900 border-4 border-black p-5 shadow-[6px_6px_0px_#000] text-white flex flex-col gap-4 relative animate-scaleUp max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="font-cinzel font-bold text-base text-white flex items-center gap-2">
            ⏰ Recurring Transactions
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-zinc-950 border-2 border-black font-bold text-xs flex items-center justify-center hover:bg-baby-pink hover:text-dungeon transition-all shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Subtitle explanation */}
        <p className="text-xs text-zinc-400 font-sans text-left -mt-2">
          Automate regular expenses, allowances, or monthly subscriptions. Overdue rules run safely without causing negative balances.
        </p>

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <span className="font-cinzel text-xs font-bold text-zinc-300">
            Active Rules ({recurringList.filter((r) => r.isActive).length}/{recurringList.length})
          </span>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className={`px-3 py-1 border-2 border-black font-cinzel text-xs font-bold transition-all shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer ${
              showForm ? "bg-baby-pink text-dungeon" : "bg-sky-blue text-dungeon"
            }`}
          >
            {showForm ? "✕ Cancel" : "+ New Auto Rule"}
          </button>
        </div>

        {/* Create / Edit Rule Form */}
        {showForm && (
          <form onSubmit={handleSaveRule} className="border-2 border-black p-3.5 bg-zinc-950 flex flex-col gap-3 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <h4 className="font-cinzel font-bold text-xs text-amber-300 flex items-center gap-1">
                {editingRule ? "✏️ Edit Rule & Reschedule Date" : "✨ Setup New Recurring Rule"}
              </h4>
              {editingRule && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  Editing: {editingRule.description}
                </span>
              )}
            </div>

            {formError && (
              <div className="p-2 bg-red-950/80 border border-red-700 text-red-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            {/* Type selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex-1 py-1 border-2 border-black text-xs font-bold transition-all shadow-[1px_1px_0px_#000] cursor-pointer ${
                    type === "expense" ? "bg-baby-pink text-dungeon" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  Expense (Auto-Pay)
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex-1 py-1 border-2 border-black text-xs font-bold transition-all shadow-[1px_1px_0px_#000] cursor-pointer ${
                    type === "income" ? "bg-sky-blue text-dungeon" : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  Income (Allowance)
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400">Description / Title</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Netflix, Spotify, Internet Bill, Weekly Allowance"
                className="p-1.5 border-2 border-black text-xs bg-zinc-900 text-white outline-none focus:bg-zinc-850"
                required
              />
            </div>

            {/* Amount & Frequency Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400">Amount (Rp)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="p-1.5 border-2 border-black text-xs bg-zinc-900 text-white font-mono outline-none focus:bg-zinc-850"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400">Frequency</label>
                <BrutalistSelect
                  value={frequency}
                  onChange={(val) => setFrequency(val as any)}
                  options={[
                    { value: "daily", label: "📅 Daily" },
                    { value: "weekly", label: "🗓️ Weekly" },
                    { value: "monthly", label: "📆 Monthly" },
                  ]}
                />
              </div>
            </div>

            {/* Pocket & Category Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400">Target Pocket</label>
                <BrutalistSelect
                  value={pocketId}
                  onChange={(val) => setPocketId(val)}
                  options={pocketsList.map((p) => ({
                    value: p.id,
                    label: `${p.name} (Rp ${parseFloat(p.balance).toLocaleString("id-ID")})${p.isLocked ? " 🔒" : ""}`,
                    disabled: type === "expense" && !!p.isLocked,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400">Category (Optional)</label>
                <BrutalistSelect
                  value={categoryId}
                  onChange={(val) => setCategoryId(val)}
                  placeholder="None"
                  options={[
                    { value: "", label: "No Category" },
                    ...categoriesList.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Live Pocket Balance Status for Expenses */}
            {type === "expense" && currentSelectedPocket && (
              <div
                className={`p-2 border text-[11px] font-sans flex items-start gap-2 rounded transition-all ${
                  isBalanceInsufficient
                    ? "bg-red-950/80 border-red-600 text-red-200"
                    : "bg-zinc-900 border-zinc-700 text-zinc-300"
                }`}
              >
                <span className="text-xs">{isBalanceInsufficient ? "⚠️" : "💰"}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span>
                      Pocket Balance:{" "}
                      <strong className={isBalanceInsufficient ? "text-red-300 font-mono" : "text-green-400 font-mono"}>
                        Rp {currentSelectedBalance.toLocaleString("id-ID")}
                      </strong>
                    </span>
                    {parsedAmountVal > 0 && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {isBalanceInsufficient
                          ? `Deficit: -Rp ${(parsedAmountVal - currentSelectedBalance).toLocaleString("id-ID")}`
                          : `Remaining: Rp ${(currentSelectedBalance - parsedAmountVal).toLocaleString("id-ID")}`}
                      </span>
                    )}
                  </div>
                  {isBalanceInsufficient && (
                    <p className="text-[10px] text-red-300 font-semibold mt-1">
                      You need at least Rp {parsedAmountVal.toLocaleString("id-ID")} in this pocket to set up this recurring expense. Please top up pocket &quot;{currentSelectedPocket.name}&quot; first or reduce the amount.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Next Payment Date with Hint */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400">
                  {editingRule ? "Next Run Date (Reschedule)" : "First Run Date"}
                </label>
                <span className="text-[9px] text-amber-400 font-mono">
                  Today: {new Date().toLocaleDateString("en-CA")}
                </span>
              </div>
              <input
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 border-2 border-black text-xs bg-zinc-900 text-white outline-none focus:bg-zinc-850"
                required
              />
              <p className="text-[9px] text-zinc-400 italic">
                💡 Changing this date reschedules the next auto-transaction. If set to today, it will execute on your next visit or cron run.
              </p>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isBalanceInsufficient}
                className={`flex-1 py-2 font-cinzel text-xs font-bold border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer ${
                  isBalanceInsufficient
                    ? "bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed shadow-none"
                    : "bg-amber-400 hover:bg-amber-300 text-dungeon"
                }`}
              >
                {isSubmitting
                  ? "SAVING..."
                  : isBalanceInsufficient
                  ? "⚠️ INSUFFICIENT BALANCE TO SAVE"
                  : editingRule
                  ? "UPDATE & RESCHEDULE RULE"
                  : "CONFIRM & SAVE AUTO RULE"}
              </button>
            </div>
          </form>
        )}

        {/* List of Recurring Rules */}
        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {recurringList.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-zinc-800 text-center text-zinc-400 text-xs">
              <span className="text-3xl block mb-2">⏰</span>
              <p className="font-bold text-zinc-300">No recurring rules configured yet.</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Click <b>+ New Auto Rule</b> above to automate regular expenses, subscriptions, or scheduled allowances.
              </p>
            </div>
          ) : (
            recurringList.map((rule) => {
              const ruleAmount = parseFloat(rule.amount);
              const linkedPocket = pocketsList.find((p) => p.id === rule.pocketId);
              const pocketBal = linkedPocket ? parseFloat(linkedPocket.balance) : 0;
              const isLowBalance = rule.type === "expense" && pocketBal < ruleAmount;

              return (
                <div
                  key={rule.id}
                  className={`border-3 border-black p-3 bg-zinc-950 text-left flex flex-col gap-2 shadow-[2px_2px_0px_#000] transition-all ${
                    rule.isActive ? "" : "opacity-60 bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 border border-black uppercase shadow-[1px_1px_0px_#000] ${
                            rule.type === "income" ? "bg-sky-blue text-dungeon" : "bg-baby-pink text-dungeon"
                          }`}
                        >
                          {rule.type}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 uppercase rounded">
                          {rule.frequency}
                        </span>
                        {!rule.isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 rounded">
                            Paused
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white mt-1 truncate" title={rule.description}>
                        {rule.description}
                      </h4>

                      <p className={`font-mono text-xs font-bold mt-0.5 ${rule.type === "income" ? "text-sky-300" : "text-baby-pink"}`}>
                        {rule.type === "income" ? "+" : "-"}Rp {ruleAmount.toLocaleString("id-ID")}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1 font-sans">
                        <span>💼 {rule.pocketName}</span>
                        {rule.categoryName && <span>• 🏷️ {rule.categoryName}</span>}
                      </div>

                      <p className="text-[9px] text-zinc-400 mt-1 font-mono">
                        Next Run:{" "}
                        <strong className="text-zinc-200">
                          {new Date(rule.nextRunDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                        {rule.lastRunDate && (
                          <span className="text-zinc-500 ml-2">
                            (Last: {new Date(rule.lastRunDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Rule Action Buttons */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {/* Run Now Button */}
                      <button
                        type="button"
                        disabled={runningRuleId === rule.id}
                        onClick={() => handleRunNow(rule)}
                        className="px-2 py-1 bg-sky-blue hover:bg-sky-400 border border-black text-dungeon text-[10px] font-bold shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        title="Execute this rule immediately and advance next run date"
                      >
                        {runningRuleId === rule.id ? "⏳..." : "⚡ Run Now"}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => startEdit(rule)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] font-bold shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer text-center"
                        title="Change date, amount, pocket, or frequency"
                      >
                        ✏️ Edit
                      </button>

                      {/* Pause / Resume Button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(rule)}
                        className={`px-2 py-1 border border-black text-[10px] font-bold transition-all shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer ${
                          rule.isActive ? "bg-zinc-900 text-amber-300 hover:bg-zinc-800" : "bg-green-700 text-white hover:bg-green-600"
                        }`}
                        title={rule.isActive ? "Pause auto execution" : "Resume auto execution"}
                      >
                        {rule.isActive ? "⏸️ Pause" : "▶️ Resume"}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id, rule.description)}
                        className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-black text-red-300 text-[10px] font-bold shadow-[1px_1px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer text-center"
                        title="Delete rule"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Low Balance Warning Badge */}
                  {isLowBalance && (
                    <div className="p-2 bg-amber-950/70 border border-amber-600 text-amber-300 text-[10px] font-sans flex items-start gap-1.5 rounded">
                      <span className="text-xs">⚠️</span>
                      <div className="flex-1">
                        <strong>Low Pocket Balance:</strong> Available{" "}
                        <span className="font-mono font-bold text-amber-200">
                          Rp {pocketBal.toLocaleString("id-ID")}
                        </span>{" "}
                        / Required{" "}
                        <span className="font-mono font-bold text-amber-200">
                          Rp {ruleAmount.toLocaleString("id-ID")}
                        </span>
                        . This expense will be <strong>skipped</strong> on its due date without deducting negative balances. Please top up pocket &quot;{rule.pocketName}&quot; or click <strong>⚡ Run Now</strong> after funding.
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Informational Guidance Footer */}
        <div className="p-2.5 bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-sans flex items-start gap-2 text-left rounded">
          <span className="text-amber-400 text-sm">💡</span>
          <div className="space-y-0.5">
            <p className="text-zinc-200 font-semibold text-[11px]">How Auto Recurring Works:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[10px]">
              <li>Overdue rules process automatically on your visit or daily via cloud cron.</li>
              <li>If pocket balance is lower than an expense, it is <strong>safely skipped</strong> (no negative balances).</li>
              <li>Once you top up funds, click <strong>⚡ Run Now</strong> to execute immediately.</li>
              <li>To adjust your billing date, pocket, or amount, click <strong>✏️ Edit</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
