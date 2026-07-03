"use client";

import { useState, useRef, useEffect } from "react";

export default function CategoryFilter({ categories, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(cat) {
    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];
    onChange(next);
  }

  function clear() {
    onChange([]);
    setOpen(false);
  }

  const label = selected.length === 0
    ? "Semua kategori"
    : selected.length === 1
      ? selected[0]
      : `${selected.length} kategori`;

  return (
    <div className="relative flex flex-col gap-1" ref={ref}>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Kategori
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 min-w-[150px]"
      >
        <span className={selected.length > 0 ? "" : "text-slate-400 dark:text-slate-500"}>
          {label}
        </span>
        <svg className={`ml-2 h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-750"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cat)}
                  onChange={() => toggle(cat)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {cat}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-100 px-2 py-1 dark:border-slate-700">
              <button
                type="button"
                onClick={clear}
                className="w-full rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-750"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
