"use client";

import { useMemo } from "react";
import { getMonthlyCycleRange, formatRangeLabel } from "@/lib/dates";

export default function MonthNavigator({
  monthlyStartDay,
  selectedMonth,
  selectedYear,
  onPrev,
  onNext,
}) {
  const range = useMemo(
    () => getMonthlyCycleRange(selectedYear, selectedMonth, monthlyStartDay),
    [selectedYear, selectedMonth, monthlyStartDay]
  );

  const label = useMemo(
    () => formatRangeLabel(range.start, range.end),
    [range]
  );

  return (
    <div className="inline-flex items-center rounded-full bg-brand-600 px-2 py-1.5 shadow-lg shadow-brand-600/25 dark:shadow-brand-600/15">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        aria-label="Bulan sebelumnya"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <span className="min-w-[140px] text-center text-sm font-semibold tracking-tight text-white">
        {label}
      </span>

      <button
        type="button"
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        aria-label="Bulan berikutnya"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
