"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn, categoryColor, categoryEmoji, formatRupiah, isIncome } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

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

// Keyword search over keterangan (shared by mobile header + desktop transactions)
export function SearchBox({ className, autoFocus }) {
  const { search, setSearch } = useDashboard();
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Cari keterangan — mis. "arisan"'
        className="pl-11"
        autoFocus={autoFocus}
      />
    </div>
  );
}

// Mobile top bar: search toggle (left) · period pill (center) · filter sheet (right)
export function MobileHeaderBar() {
  const { search, setSearch, filteredCycle, resetFilters } = useDashboard();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchActive = searchOpen || search.trim().length > 0;

  const toggleSearch = () => {
    if (searchOpen) setSearch("");
    setSearchOpen((v) => !v);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Cari"
          onClick={toggleSearch}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            searchActive
              ? "bg-pill text-pill-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <Search className="h-4 w-4" />
        </button>

        <PeriodPill className="min-w-0" />

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Filter"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-bold text-muted-foreground"
              >
                Reset
              </button>
            </SheetHeader>
            <FilterFields />
            <SheetClose asChild>
              <Button size="lg" className="mt-2 w-full">
                Tampilkan {filteredCycle.length} transaksi
              </Button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </div>

      {searchOpen && <SearchBox autoFocus />}
    </div>
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
