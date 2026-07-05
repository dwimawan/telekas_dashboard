"use client";

import { useEffect, useMemo, useState } from "react";
import MonthNavigator from "@/components/MonthNavigator";
import CreatedByFilter from "@/components/CreatedByFilter";
import SumberDanaFilter from "@/components/SumberDanaFilter";
import CategoryFilter from "@/components/CategoryFilter";
import SearchInput from "@/components/SearchInput";
import SummaryCards from "@/components/SummaryCards";
import ChartsGrid from "@/components/ChartsGrid";
import TransactionTable from "@/components/TransactionTable";
import DarkModeToggle from "@/components/DarkModeToggle";
import UserMenu from "@/components/UserMenu";
import { getMonthlyCycleRange } from "@/lib/dates";

// Skeleton Loading Components
function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-64 space-y-3 rounded bg-slate-100/50 p-4 dark:bg-slate-700/50">
        <div className="h-full w-full rounded bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-3 h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [yearlyTransactions, setYearlyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  const defaultMonthlyStartDay = Number(
    process.env.NEXT_PUBLIC_DEFAULT_MONTHLY_START_DAY || 1
  );
  const now = new Date();

  const [createdBy, setCreatedBy] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [sumberDana, setSumberDana] = useState("");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [monthlyStartDay] = useState(defaultMonthlyStartDay);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Populate filter options
  const [allCreatedBy, setAllCreatedBy] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const isCurrentMonth =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const activeRange = useMemo(
    () => getMonthlyCycleRange(selectedYear, selectedMonth, monthlyStartDay),
    [selectedYear, selectedMonth, monthlyStartDay]
  );

  const yearlyRange = useMemo(() => {
    const y = now.getFullYear();
    const end = new Date().toISOString().slice(0, 10);
    return { start: `${y}-01-01`, end };
  }, []);

  const goPrev = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  // Fetch current user to set default createdBy
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setCurrentUser(data.username);
          setCreatedBy(data.username);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch unfiltered (no createdBy) to populate filter options
  useEffect(() => {
    const params = new URLSearchParams({
      start: activeRange.start,
      end: activeRange.end,
    });
    // Explicitly send empty createdBy to get ALL users
    params.set("createdBy", "");

    fetch(`/api/transactions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const txs = data.transactions || [];
        setAllCreatedBy(
          [...new Set(txs.map((t) => t.createdBy).filter(Boolean))].sort()
        );
        setAllSources(
          [...new Set(txs.map((t) => t.source).filter(Boolean))].sort()
        );
        setAllCategories(
          [...new Set(txs.map((t) => t.kategori).filter(Boolean))].sort()
        );
      })
      .catch(() => { });
  }, [activeRange]);

  // Fetch transactions with createdBy filter
  useEffect(() => {
    let cancelled = false;
    if (!currentUser) return; // wait until we know the user

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      start: activeRange.start,
      end: activeRange.end,
    });
    // createdBy is always set (defaults to current user)
    params.set("createdBy", createdBy);
    const qs = params.toString();

    fetch(`/api/transactions?${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setTransactions(data.transactions || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeRange, createdBy, currentUser]);

  // Fetch yearly transactions (Jan 1 → today) with createdBy filter only
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      start: yearlyRange.start,
      end: yearlyRange.end,
      createdBy,
    });

    fetch(`/api/transactions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setYearlyTransactions(data.transactions || []);
      })
      .catch(() => { });

    return () => { cancelled = true; };
  }, [yearlyRange, createdBy]);

  // Auto-hide success notification after 2s
  useEffect(() => {
    if (!showSuccessNotification) return;
    const timer = setTimeout(() => setShowSuccessNotification(false), 2000);
    return () => clearTimeout(timer);
  }, [showSuccessNotification]);

  // Refresh all data without page reload
  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    const startTime = Date.now();
    try {
      const [monthly, yearly] = await Promise.all([
        fetch(`/api/transactions?${new URLSearchParams({ start: activeRange.start, end: activeRange.end, createdBy }).toString()}`)
          .then((r) => { if (!r.ok) throw new Error("Gagal refresh"); return r.json(); }),
        // Yearly data: with createdBy filter, but full year (Jan-today)
        fetch(`/api/transactions?${new URLSearchParams({ start: yearlyRange.start, end: yearlyRange.end, createdBy }).toString()}`)
          .then((r) => r.json()),
      ]);
      setTransactions(monthly.transactions || []);
      setYearlyTransactions(yearly.transactions || []);
      setError(null);

      // If response was fast (< 1s), add artificial delay to minimum 3s
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - elapsedTime));
      }

      // Show success notification after animation finishes
      setShowSuccessNotification(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const shouldSearch = term.length > 3;

    return transactions.filter((t) => {
      if (sumberDana && t.source !== sumberDana) return false;
      if (categories.length > 0 && !categories.includes(t.kategori)) return false;
      if (shouldSearch && !t.keterangan?.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [transactions, sumberDana, categories, search]);

  // Apply sumberDana, kategori, search filters to yearly data (but NOT date range)
  const yearlyFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const shouldSearch = term.length > 3;

    return yearlyTransactions.filter((t) => {
      if (sumberDana && t.source !== sumberDana) return false;
      if (categories.length > 0 && !categories.includes(t.kategori)) return false;
      if (shouldSearch && !t.keterangan?.toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [yearlyTransactions, sumberDana, categories, search]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            TeleKas Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ringkasan transaksi dari TeleKas Bot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <DarkModeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Month Navigator + Today + Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MonthNavigator
            monthlyStartDay={monthlyStartDay}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onPrev={goPrev}
            onNext={goNext}
          />
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={goToday}
              className="rounded-full border border-brand-500 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              Bulan ini
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <CreatedByFilter
            users={allCreatedBy}
            value={createdBy}
            onChange={setCreatedBy}
          />
          <SumberDanaFilter
            sources={allSources}
            value={sumberDana}
            onChange={setSumberDana}
          />
          <CategoryFilter
            categories={allCategories}
            selected={categories}
            onChange={setCategories}
          />
          <SearchInput value={search} onChange={setSearch} />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-expense/30 bg-expense/5 px-4 py-3 text-sm text-expense">
          {error}
        </div>
      )}

      {showSuccessNotification && (
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400">
          ✓ Data berhasil diperbarui
        </div>
      )}

      <div className="mb-6">
        {refreshing ? <SummarySkeleton /> : <SummaryCards transactions={filtered} />}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          Memuat data…
        </div>
      ) : (
        <>
          <div className="mb-6">
            {refreshing ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <ChartSkeleton key={i} />
                ))}
              </div>
            ) : (
              <ChartsGrid transactions={filtered} yearlyTransactions={yearlyFiltered} range={activeRange} />
            )}
          </div>
          <div>
            {refreshing ? (
              <TableSkeleton />
            ) : (
              <TransactionTable
                transactions={filtered}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
