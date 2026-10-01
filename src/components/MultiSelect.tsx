"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder: string;
  formatOption?: (opt: string) => string;
}

export function MultiSelect({ options, selected, onChange, placeholder, formatOption }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        type="button"
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none hover:border-white/30 transition-colors h-[38px]"
      >
        <span>
          {selected.size === 0 
            ? placeholder 
            : selected.size === 1 
              ? (formatOption ? formatOption(Array.from(selected)[0]) : Array.from(selected)[0]) 
              : `${selected.size} ${placeholder.split(' ')[1] || 'Selected'}`}
        </span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute z-50 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-lg p-2 max-h-60 overflow-y-auto shadow-2xl flex flex-col gap-1">
          {options.length === 0 ? (
            <div className="p-2 text-[10px] text-neutral-500 font-sans uppercase tracking-widest text-center">No options</div>
          ) : (
            options.map(opt => (
              <label 
                key={opt} 
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer text-[10px] uppercase tracking-widest font-sans text-neutral-300 transition-colors"
              >
                <div className={`w-3 h-3 rounded flex items-center justify-center border ${selected.has(opt) ? 'bg-white border-white text-black' : 'border-white/20'}`}>
                  {selected.has(opt) && <Check size={10} strokeWidth={3} />}
                </div>
                <span className="truncate">{formatOption ? formatOption(opt) : opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
