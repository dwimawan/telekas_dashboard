"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "@/components/dashboard-provider";
import {
  PeriodPill,
  TxAvatar,
  TxAmount,
  SearchBox,
  MobileHeaderBar,
} from "@/components/widgets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { expensesOf, sumNominal, groupByDay } from "@/lib/aggregate";
import { formatRupiah } from "@/lib/utils";
import { parseTanggal } from "@/lib/dates";

const MOBILE_PAGE = 20;
const PAGE_SIZE_OPTIONS = [10, 50, 100, 1000];

// Column header with v1 sort affordance: ▲ asc, ▼ desc, ↕ inactive
function SortHeader({ label, sortKey, sort, onSort, align = "left" }) {
  const active = sort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex select-none items-center gap-1 uppercase tracking-wide ${
        align === "right" ? "justify-end text-right" : "text-left"
      }`}
    >
      {label}
      <span className={`text-[10px] ${active ? "text-primary" : "text-faint"}`}>
        {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export default function TransactionsPage() {
  const { filteredCycle, loading, refreshing, error } = useDashboard();

  // ----- Mobile: newest-first list revealed in chunks (load more)
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE);

  const totalExpenses = useMemo(
    () => sumNominal(expensesOf(filteredCycle)),
    [filteredCycle]
  );

  const newestFirst = useMemo(
    () =>
      [...filteredCycle].sort(
        (a, b) => (parseTanggal(b.tanggal) || 0) - (parseTanggal(a.tanggal) || 0)
      ),
    [filteredCycle]
  );

  useEffect(() => {
    setVisibleCount(MOBILE_PAGE);
  }, [filteredCycle]);

  const groups = useMemo(
    () => groupByDay(newestFirst.slice(0, visibleCount)),
    [newestFirst, visibleCount]
  );
  const remaining = Math.max(0, newestFirst.length - visibleCount);

  // ----- Desktop: v1 pagination + column sort spec
  const [sort, setSort] = useState({ key: "tanggal", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function handleSort(key) {
    setPage(1);
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  const sorted = useMemo(() => {
    const arr = [...filteredCycle];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sort.key === "tanggal") {
        cmp = (parseTanggal(a.tanggal) || 0) - (parseTanggal(b.tanggal) || 0);
      } else if (sort.key === "nominal") {
        cmp = (a.nominal || 0) - (b.nominal || 0);
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredCycle, sort]);

  useEffect(() => {
    setPage(1);
  }, [filteredCycle, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sorted.slice(startIdx, startIdx + pageSize);
  }, [sorted, currentPage, pageSize]);

  if (loading || refreshing) return <TransactionsSkeleton />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ============ Mobile (design 02 + 03) ============ */}
      <div className="flex flex-col gap-4 lg:hidden">
        <MobileHeaderBar />
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <div className="text-[13px] font-semibold text-muted-foreground">
            Total pengeluaran
          </div>
          <div className="text-[32px] font-extrabold tabular">
            {formatRupiah(totalExpenses)}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Tidak ada transaksi
          </div>
        )}
        {groups.map((g) => {
          const dayTotal = sumNominal(expensesOf(g.items));
          return (
          <div key={g.iso} className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-bold text-secondary-foreground">
                {g.label}
              </div>
              {dayTotal > 0 && (
                <div className="text-sm font-bold text-muted-foreground tabular">
                  -{formatRupiah(dayTotal)}
                </div>
              )}
            </div>
            {g.items.map((tx, i) => (
              <div key={tx.id ?? `${g.iso}-${i}`} className="flex items-center gap-3">
                <TxAvatar tx={tx} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="truncate text-[15px] font-bold">
                    {tx.keterangan || tx.kategori || "Transaksi"}
                  </div>
                  <div className="truncate text-xs font-semibold text-muted-foreground">
                    {tx.kategori}
                    {tx.source ? ` · ${tx.source}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <TxAmount tx={tx} className="text-[15px]" />
                  <div className="text-[11px] font-semibold text-faint">
                    {tx.createdBy ? `oleh ${tx.createdBy}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
          );
        })}

        {remaining > 0 && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => setVisibleCount((c) => c + MOBILE_PAGE)}
          >
            Muat lebih banyak ({remaining} tersisa)
          </Button>
        )}
      </div>

      {/* ============ Desktop (design 07, filters live in sidebar) ============ */}
      <div className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[22px] font-extrabold">Transaksi</h1>
            <div className="flex flex-1 items-center justify-end gap-3">
              <SearchBox className="max-w-md flex-1" />
              <PeriodPill size="sm" />
            </div>
          </div>

          <Card className="px-5 py-2">
            <div className="grid grid-cols-[44px_1.4fr_1fr_1fr_0.9fr_0.9fr] items-center gap-3 border-b border-border py-3 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
              <div />
              <SortHeader label="Transaksi" sortKey="tanggal" sort={sort} onSort={handleSort} />
              <div>Kategori</div>
              <div>Sumber dana</div>
              <div>Dibuat oleh</div>
              <SortHeader label="Jumlah" sortKey="nominal" sort={sort} onSort={handleSort} align="right" />
            </div>
            {pageItems.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada transaksi
              </div>
            )}
            {pageItems.map((tx, i) => (
              <div
                key={tx.id ?? i}
                className="grid grid-cols-[44px_1.4fr_1fr_1fr_0.9fr_0.9fr] items-center gap-3 border-b border-secondary py-3 last:border-0"
              >
                <TxAvatar tx={tx} size="sm" />
                <div className="flex min-w-0 flex-col">
                  <div className="truncate text-sm font-bold">
                    {tx.keterangan || tx.kategori || "Transaksi"}
                  </div>
                  <div className="truncate text-[11px] font-semibold text-muted-foreground">
                    {tx.tanggal}
                  </div>
                </div>
                <div className="truncate text-[13px] font-semibold text-secondary-foreground">
                  {tx.kategori}
                </div>
                <div className="truncate text-[13px] font-semibold text-muted-foreground">
                  {tx.source}
                </div>
                <div className="truncate text-[13px] font-semibold text-muted-foreground">
                  {tx.createdBy}
                </div>
                <TxAmount tx={tx} className="text-right text-sm" />
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Baris / halaman
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                  className="rounded-lg border border-input bg-secondary px-2.5 py-1.5 text-[13px] font-bold text-secondary-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="ml-2">Total transaksi: {sorted.length}</span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          </Card>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Skeleton className="h-9 w-40 rounded-full" />
      <Skeleton className="h-11 rounded-[14px]" />
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-2xl" />
      ))}
    </div>
  );
}
