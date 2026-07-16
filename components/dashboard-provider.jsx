"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMonthlyCycleRange, toISODate } from "@/lib/dates";

const DashboardContext = createContext(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}

function applyClientFilters(txs, { sumberDana, categories, search }) {
  const term = search.trim().toLowerCase();
  const shouldSearch = term.length >= 2;
  return txs.filter((t) => {
    if (sumberDana && t.source !== sumberDana) return false;
    if (categories.length > 0 && !categories.includes(t.kategori)) return false;
    if (shouldSearch && !t.keterangan?.toLowerCase().includes(term)) return false;
    return true;
  });
}

export default function DashboardProvider({ children }) {
  const now = useMemo(() => new Date(), []);
  const monthlyStartDay = Number(
    process.env.NEXT_PUBLIC_DEFAULT_MONTHLY_START_DAY || 1
  );

  const [currentUser, setCurrentUser] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [sumberDana, setSumberDana] = useState("");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("M"); // D | W | M | 6M | Y

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [cycleTx, setCycleTx] = useState([]);
  const [wideTx, setWideTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [allCreatedBy, setAllCreatedBy] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const isCurrentMonth =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const activeRange = useMemo(
    () => getMonthlyCycleRange(selectedYear, selectedMonth, monthlyStartDay),
    [selectedYear, selectedMonth, monthlyStartDay]
  );

  // Wide window: covers year-to-date AND the last 6 calendar months,
  // so 6M / Y summaries and the monthly chart work across year boundaries.
  const wideRange = useMemo(() => {
    const janFirst = new Date(now.getFullYear(), 0, 1);
    const sixBack = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const start = sixBack < janFirst ? sixBack : janFirst;
    return { start: toISODate(start), end: toISODate(now) };
  }, [now]);

  const goPrev = useCallback(() => {
    setSelectedMonth((m) => {
      if (m === 1) {
        setSelectedYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setSelectedMonth((m) => {
      if (m === 12) {
        setSelectedYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  const goToday = useCallback(() => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, [now]);

  // Current user → default createdBy filter
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setCurrentUser(data.username);
          setCreatedBy(data.username);
        }
      })
      .catch(() => {});
  }, []);

  // Unfiltered cycle fetch → filter options
  useEffect(() => {
    const params = new URLSearchParams({
      start: activeRange.start,
      end: activeRange.end,
      createdBy: "",
    });
    fetch(`/api/transactions?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const txs = data.transactions || [];
        setAllCreatedBy([...new Set(txs.map((t) => t.createdBy).filter(Boolean))].sort());
        setAllSources([...new Set(txs.map((t) => t.source).filter(Boolean))].sort());
        setAllCategories([...new Set(txs.map((t) => t.kategori).filter(Boolean))].sort());
      })
      .catch(() => {});
  }, [activeRange]);

  const fetchRange = useCallback(
    async (range) => {
      const params = new URLSearchParams({
        start: range.start,
        end: range.end,
        createdBy,
      });
      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const data = await res.json();
      return data.transactions || [];
    },
    [createdBy]
  );

  // Cycle + wide fetches
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchRange(activeRange), fetchRange(wideRange)])
      .then(([cycle, wide]) => {
        if (cancelled) return;
        setCycleTx(cycle);
        setWideTx(wide);
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
  }, [activeRange, wideRange, fetchRange]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [cycle, wide] = await Promise.all([
        fetchRange(activeRange),
        fetchRange(wideRange),
      ]);
      setCycleTx(cycle);
      setWideTx(wide);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchRange, activeRange, wideRange]);

  const clientFilters = useMemo(
    () => ({ sumberDana, categories, search }),
    [sumberDana, categories, search]
  );

  const filteredCycle = useMemo(
    () => applyClientFilters(cycleTx, clientFilters),
    [cycleTx, clientFilters]
  );
  const filteredWide = useMemo(
    () => applyClientFilters(wideTx, clientFilters),
    [wideTx, clientFilters]
  );

  const resetFilters = useCallback(() => {
    setSumberDana("");
    setCategories([]);
    setSearch("");
    setCreatedBy(currentUser);
  }, [currentUser]);

  const value = {
    currentUser,
    createdBy,
    setCreatedBy,
    sumberDana,
    setSumberDana,
    categories,
    setCategories,
    search,
    setSearch,
    period,
    setPeriod,
    monthlyStartDay,
    selectedMonth,
    selectedYear,
    isCurrentMonth,
    activeRange,
    wideRange,
    goPrev,
    goNext,
    goToday,
    cycleTx,
    wideTx,
    filteredCycle,
    filteredWide,
    loading,
    refreshing,
    refresh,
    error,
    allCreatedBy,
    allSources,
    allCategories,
    resetFilters,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
