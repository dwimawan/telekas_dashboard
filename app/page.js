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

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Filter lists — populated from unfiltered fetch
  const [allCreatedBy, setAllCreatedBy] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const isCurrentMonth =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const activeRange = useMemo(
    () => getMonthlyCycleRange(selectedYear, selectedMonth, monthlyStartDay),
    [selectedYear, selectedMonth, monthlyStartDay]
  );

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

      <div className="mb-6">
        <SummaryCards transactions={filtered} />
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          Memuat data…
        </div>
      ) : (
        <>
          <div className="mb-6">
            <ChartsGrid transactions={filtered} range={activeRange} />
          </div>
          <TransactionTable
            transactions={filtered}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </main>
  );
}
