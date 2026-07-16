"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, UserRound } from "lucide-react";
import { cn, categoryColor, categoryEmoji, formatRupiah, isIncome } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Light date-range pill: ‹ 25 Jun – 24 Jul ›
export function PeriodPill({ size = "md", className }) {
  const { activeRange, goPrev, goNext } = useDashboard();
  return (
    <div
      className={cn(
        "flex items-center whitespace-nowrap rounded-full bg-pill font-bold text-pill-foreground",
        size === "md" ? "gap-4 px-4 py-2.5 text-[15px]" : "gap-3 px-3.5 py-2 text-[13px]",
        className
      )}
    >
      <button type="button" onClick={goPrev} aria-label="Periode sebelumnya" className="opacity-85 transition-opacity hover:opacity-100">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {activeRange.label}
      <button type="button" onClick={goNext} aria-label="Periode berikutnya" className="opacity-85 transition-opacity hover:opacity-100">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const SEGMENTS = ["D", "W", "M", "6M", "Y"];

// D / W / M / 6M / Y segment control
export function SegmentControl({ className, segments = SEGMENTS }) {
  const { period, setPeriod } = useDashboard();
  return (
    <div className={cn("flex gap-1 rounded-full bg-secondary p-1", className)}>
      {segments.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setPeriod(s)}
          className={cn(
            "rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors",
            s === period
              ? "bg-pill text-pill-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// "Dibuat oleh ▾" pill with dropdown — defaults to the logged-in user (set in provider)
export function CreatedByPill({ className }) {
  const { createdBy, setCreatedBy, allCreatedBy } = useDashboard();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-[13px] font-semibold text-secondary-foreground transition-colors hover:bg-input",
            className
          )}
        >
          <UserRound className="h-4 w-4 text-primary" />
          {createdBy || "Semua pengguna"}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setCreatedBy("")}>
          Semua pengguna
        </DropdownMenuItem>
        {allCreatedBy.map((u) => (
          <DropdownMenuItem key={u} onClick={() => setCreatedBy(u)}>
            {u}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Round emoji avatar tinted by category color
export function TxAvatar({ tx, size = "md" }) {
  return (
    <div
      className={cn(
        "tx-avatar flex shrink-0 items-center justify-center rounded-full",
        size === "md" ? "h-[42px] w-[42px] text-xl" : "h-9 w-9 text-base"
      )}
      style={{ background: `${categoryColor(tx.kategori)}2E` }}
    >
      <span className="emoji-bounce" aria-hidden="true">
        {categoryEmoji(tx.kategori)}
      </span>
    </div>
  );
}

export function TxAmount({ tx, className }) {
  const income = isIncome(tx);
  return (
    <span
      className={cn(
        "whitespace-nowrap font-bold tabular",
        income ? "text-primary" : "text-destructive",
        className
      )}
    >
      {income ? "+" : "-"}
      {formatRupiah(tx.nominal)}
    </span>
  );
}

// Selectable chip row used in filters; `emojiFor` prefixes each chip with an emoji
export function ChipRow({ options, value, onSelect, allLabel, emojiFor }) {
  const items = allLabel
    ? [{ key: "", label: allLabel }, ...options.map((o) => ({ key: o, label: o }))]
    : options.map((o) => ({ key: o, label: o }));
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label }) => {
        const active = Array.isArray(value) ? value.includes(key) : value === key;
        return (
          <button
            key={key || "__all"}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-secondary text-secondary-foreground hover:bg-input"
            )}
          >
            {emojiFor && key ? (
              <span className="emoji-bounce mr-1.5" aria-hidden="true">
                {emojiFor(key)}
              </span>
            ) : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

const TOP_CATEGORIES = 5;

// Shared filter fields (dibuat oleh / sumber dana / kategori) — transactions & dashboard
export function FilterFields() {
  const {
    allCreatedBy, createdBy, setCreatedBy,
    allSources, sumberDana, setSumberDana,
    allCategories, categories, setCategories,
    cycleTx,
  } = useDashboard();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const toggleCategory = (c) =>
    c === ""
      ? setCategories([])
      : setCategories((prev) =>
          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
        );

  // Rank categories by cycle spend; collapsed view = top 5 + any active selection
  const rankedCategories = useMemo(() => {
    const totals = new Map();
    cycleTx.forEach((t) => {
      if (t.kategori) totals.set(t.kategori, (totals.get(t.kategori) || 0) + (t.nominal || 0));
    });
    return [...allCategories].sort((a, b) => (totals.get(b) || 0) - (totals.get(a) || 0));
  }, [allCategories, cycleTx]);

  const visibleCategories = showAllCategories
    ? rankedCategories
    : rankedCategories.filter((c, i) => i < TOP_CATEGORIES || categories.includes(c));
  const hiddenCount = rankedCategories.length - visibleCategories.length;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold text-muted-foreground">Dibuat oleh</div>
        <ChipRow
          options={allCreatedBy}
          value={createdBy}
          onSelect={setCreatedBy}
          allLabel="Semua"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold text-muted-foreground">Sumber dana</div>
        <ChipRow
          options={allSources}
          value={sumberDana}
          onSelect={setSumberDana}
          allLabel="Semua"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold text-muted-foreground">Kategori</div>
        <ChipRow
          options={visibleCategories}
          value={categories.length === 0 ? "" : categories}
          onSelect={toggleCategory}
          allLabel="Semua"
          emojiFor={categoryEmoji}
        />
        {(hiddenCount > 0 || showAllCategories) && (
          <button
            type="button"
            onClick={() => setShowAllCategories((v) => !v)}
            className="self-start text-xs font-bold text-primary hover:underline"
          >
            {showAllCategories ? "Tampilkan lebih sedikit" : `Muat lainnya (+${hiddenCount})`}
          </button>
        )}
      </div>
    </>
  );
}
