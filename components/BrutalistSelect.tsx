"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BrutalistSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function BrutalistSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
}: BrutalistSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full font-sans select-none ${isOpen ? "z-30" : "z-10"}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border-2 border-black bg-zinc-950 text-white flex justify-between items-center outline-none cursor-pointer text-sm font-medium hover:bg-zinc-900 transition-all rounded-lg"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={`text-xs ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Options List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 border-2 border-black bg-zinc-950 shadow-[4px_4px_0px_#000] z-50 max-h-60 overflow-y-auto rounded-lg">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`p-2.5 text-sm transition-colors font-medium ${
                opt.disabled
                  ? "opacity-40 cursor-not-allowed text-zinc-500 bg-zinc-900/50"
                  : opt.value === value
                    ? "bg-zinc-800 text-white cursor-pointer hover:bg-sky-blue hover:text-dungeon"
                    : "text-zinc-200 cursor-pointer hover:bg-sky-blue hover:text-dungeon"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
