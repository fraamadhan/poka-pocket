"use client";

import React, { useState, useEffect } from "react";
import { transferPocketBalance } from "@/app/actions/transactions";
import { parseCurrencyInput } from "@/lib/currency";

interface Pocket {
  id: string;
  name: string;
  balance: string;
  icon: string;
  isGoal?: boolean;
  targetAmount?: string | null;
  targetDate?: Date | string | null;
  isLocked?: boolean;
  createdAt?: Date;
}

export interface TransferSuccessData {
  fromPocketId: string;
  newFromBalance: string;
  toPocketId: string;
  newToBalance: string;
  fromPocketName: string;
  toPocketName: string;
  amount: string;
  outTransId: string;
  inTransId: string;
  note: string | null;
}

interface TransferModalProps {
  isOpen: boolean;
  pocketsList: Pocket[];
  onClose: () => void;
  onTransferSuccess: (data: TransferSuccessData) => void;
  triggerToast: (msg: string) => void;
}

export default function TransferModal({
  isOpen,
  pocketsList,
  onClose,
  onTransferSuccess,
  triggerToast,
}: TransferModalProps) {
  const [fromPocketId, setFromPocketId] = useState("");
  const [toPocketId, setToPocketId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset selected pockets when modal opens
  useEffect(() => {
    if (isOpen && pocketsList.length > 0) {
      const defaultFrom = pocketsList.find((p) => !p.isLocked) || pocketsList[0];
      setFromPocketId(defaultFrom.id);
      const defaultTo = pocketsList.find((p) => p.id !== defaultFrom.id);
      setToPocketId(defaultTo ? defaultTo.id : "");
      setAmount("");
      setNote("");
      setError(null);
    }
  }, [isOpen, pocketsList]);

  if (!isOpen) return null;

  const selectedFromPocket = pocketsList.find((p) => p.id === fromPocketId);
  const selectedToPocket = pocketsList.find((p) => p.id === toPocketId);
  const currentAvailableBalance = selectedFromPocket ? parseFloat(selectedFromPocket.balance) : 0;

  const handleMaxAmount = () => {
    if (currentAvailableBalance > 0) {
      setAmount(currentAvailableBalance.toString());
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromPocketId || !toPocketId) {
      setError("Please select both source and destination pockets.");
      return;
    }

    if (fromPocketId === toPocketId) {
      setError("Source and destination pockets cannot be the same.");
      return;
    }

    if (selectedFromPocket?.isLocked) {
      setError(`Pocket "${selectedFromPocket.name}" is locked. Unlock the pocket first to transfer funds.`);
      return;
    }

    const numericAmount = parseCurrencyInput(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Transfer amount must be a valid positive number.");
      return;
    }

    if (numericAmount > currentAvailableBalance) {
      setError(
        `Insufficient balance in ${selectedFromPocket?.name || "source pocket"} (Available: Rp ${currentAvailableBalance.toLocaleString("id-ID")}).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await transferPocketBalance(fromPocketId, toPocketId, amount, note);

      if ("success" in res && res.success) {
        triggerToast(
          `🎉 Successfully transferred Rp ${numericAmount.toLocaleString("id-ID")} from ${res.fromPocketName} to ${res.toPocketName}!`
        );
        onTransferSuccess({
          fromPocketId: res.fromPocketId,
          newFromBalance: res.newFromBalance,
          toPocketId: res.toPocketId,
          newToBalance: res.newToBalance,
          fromPocketName: res.fromPocketName,
          toPocketName: res.toPocketName,
          amount: res.amount,
          outTransId: res.outTransId,
          inTransId: res.inTransId,
          note: res.note || null,
        });
        onClose();
      } else if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setError("Failed to complete transfer. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-zinc-900 border-4 border-black p-5 shadow-[6px_6px_0px_#000] text-white flex flex-col gap-4 relative animate-scaleUp max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="font-cinzel font-bold text-base text-white flex items-center gap-2">
            🔄 Transfer Funds
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-zinc-950 border-2 border-black font-bold text-xs flex items-center justify-center hover:bg-baby-pink hover:text-dungeon transition-all shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            title="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-950/80 border-2 border-black text-red-300 text-xs font-semibold shadow-[2px_2px_0px_#000]">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
          {/* Source Pocket */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-300">From Pocket</label>
            <select
              value={fromPocketId}
              onChange={(e) => {
                setFromPocketId(e.target.value);
                setError(null);
              }}
              className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900 transition-colors"
            >
              {pocketsList.map((p) => (
                <option key={p.id} value={p.id} disabled={p.isLocked}>
                  {p.isLocked ? `🔒 ${p.name} (Locked)` : `${p.name} — Rp ${parseFloat(p.balance).toLocaleString("id-ID")}`}
                </option>
              ))}
            </select>
            {selectedFromPocket && (
              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono mt-0.5">
                <span>Available: Rp {currentAvailableBalance.toLocaleString("id-ID")}</span>
                {currentAvailableBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-[10px] font-bold text-sky-blue underline hover:text-sky-300 cursor-pointer"
                  >
                    Use Max
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Destination Pocket */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-300">To Pocket</label>
            <select
              value={toPocketId}
              onChange={(e) => {
                setToPocketId(e.target.value);
                setError(null);
              }}
              className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900 transition-colors"
            >
              <option value="" disabled>Select destination pocket</option>
              {pocketsList.map((p) => (
                <option 
                  key={p.id} 
                  value={p.id} 
                  disabled={p.id === fromPocketId}
                >
                  {p.isGoal ? "🎯 " : ""}{p.name} {p.id === fromPocketId ? "(Source - Cannot Select)" : `— Rp ${parseFloat(p.balance).toLocaleString("id-ID")}`}
                </option>
              ))}
            </select>
            {selectedToPocket && (
              <span className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Target: {selectedToPocket.name}
              </span>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-300">Transfer Amount (Rp)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 50000"
              className="p-2 border-2 border-black text-sm bg-zinc-950 text-white outline-none focus:bg-zinc-900 font-mono font-bold"
              required
            />
          </div>

          {/* Optional Note */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-300">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly allowance reallocation"
              maxLength={100}
              className="p-2 border-2 border-black text-xs bg-zinc-950 text-white outline-none focus:bg-zinc-900"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-zinc-800 text-zinc-300 border-2 border-black font-cinzel text-xs font-bold shadow-[2px_2px_0px_#000] hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || pocketsList.length < 2}
              className="flex-1 py-2 bg-sky-blue text-dungeon border-2 border-black font-cinzel text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "TRANSFERRING..." : "TRANSFER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
