"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { parseTanggal, formatShort } from "@/lib/dates";

const PALETTE = [
  "#0d9488", "#f59e0b", "#e11d48", "#6366f1",
  "#84cc16", "#0ea5e9", "#d946ef", "#f97316",
];

function formatRupiah(n) {
  return "Rp " + n.toLocaleString("id-ID");
}

function groupByKey(items, key, limit = 6) {
  const map = new Map();
  items.forEach((tx) => {
    const k = tx[key] || "Tidak diketahui";
    map.set(k, (map.get(k) || 0) + tx.nominal);
  });
  const sorted = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= limit) return sorted;
  const head = sorted.slice(0, limit);
  const tailSum = sorted.slice(limit).reduce((s, x) => s + x.value, 0);
  return [...head, { name: "Lainnya", value: tailSum }];
}

function ChartCard({ title, children, empty }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {empty ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Tidak ada data
        </div>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  );
}

function TopExpenseList({ data }) {
  const maxValue = data[0]?.value || 1;

  return (
    <div className="space-y-4 pt-2">
      {data.map((item, index) => (
        <div key={item.key || index} className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
            <span className="truncate max-w-[60%]">{item.label}</span>
            <span>{formatRupiah(item.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-rose-500"
              style={{ width: `${Math.max(5, Math.round((item.value / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByMonthThisYear(items) {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const result = [];
  for (let m = 0; m <= currentMonth; m++) {
    const d = new Date(year, m, 1);
    const label = `${d.toLocaleString("id-ID", { month: "short" })} ${year}`;
    result.push({ label, value: 0, month: m, year });
  }

  items.forEach((tx) => {
    const date = parseTanggal(tx.tanggal);
    if (!date) return;
    if (date.getFullYear() !== year) return;
    const m = date.getMonth();
    if (m > currentMonth) return;
    result[m].value += tx.nominal || 0;
  });

  return result.map(({ label, value }) => ({ label, value }));
}

function groupByWeek(items) {
  const map = new Map();
  items.forEach((tx) => {
    const date = parseTanggal(tx.tanggal);
    if (!date) return;
    // ISO week: Monday = start of week
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + tx.nominal);
  });
  return [...map.entries()]
    .map(([key, value]) => {
      const d = new Date(key + "T00:00:00");
      const sun = new Date(d);
      sun.setDate(d.getDate() + 6);
      return {
        label: `${formatShort(d)}–${formatShort(sun)}`,
        value,
        date: d,
      };
    })
    .sort((a, b) => a.date - b.date);
}

export default function ChartsGrid({ transactions, yearlyTransactions, range }) {
  const [expanded, setExpanded] = useState(true);

  const expenses = useMemo(
    () => transactions.filter((t) => t.jenis?.toLowerCase() !== "pemasukan"),
    [transactions]
  );

  const byCategory = useMemo(() => groupByKey(expenses, "kategori"), [expenses]);
  const bySumber = useMemo(() => groupByKey(expenses, "source"), [expenses]);

  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.nominal - a.nominal)
      .slice(0, 5)
      .map((tx) => ({
        key: tx.id || `${tx.tanggal}-${tx.nominal}-${tx.keterangan}`,
        label: `${tx.keterangan || tx.kategori || tx.sumberData || "Pengeluaran"}`,
        value: tx.nominal,
      }));
  }, [expenses]);

  const totalExpense = useMemo(
    () => expenses.reduce((sum, tx) => sum + (tx.nominal || 0), 0),
    [expenses]
  );

  const rangeDays = useMemo(() => {
    const start = parseTanggal(range?.start);
    const end = parseTanggal(range?.end);
    if (!start || !end || end < start) return 1;
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [range]);

  const dailyAverage = Math.round(totalExpense / rangeDays || 0);
  const monthlyAverage = Math.round(totalExpense / Math.max(1, rangeDays / 30) || 0);

  const dailyExpenses = useMemo(() => {
    const expenseMap = new Map();
    expenses.forEach((tx) => {
      const d = parseTanggal(tx.tanggal);
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      expenseMap.set(key, (expenseMap.get(key) || 0) + tx.nominal);
    });

    const startDate = parseTanggal(range?.start);
    const endDate = parseTanggal(range?.end);
    if (!startDate || !endDate || startDate > endDate) {
      return [...expenseMap.entries()]
        .map(([key, expense]) => ({ label: formatShort(new Date(key)), expense, date: new Date(key) }))
        .sort((a, b) => a.date - b.date)
        .map(({ label, expense }) => ({ label, expense }));
    }

    const data = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().slice(0, 10);
      data.push({ label: formatShort(current), expense: expenseMap.get(key) || 0 });
      current.setDate(current.getDate() + 1);
    }
    return data;
  }, [expenses, range]);

  const weeklySeries = useMemo(() => groupByWeek(expenses), [expenses]);

  const weeklyAverage = useMemo(() => {
    if (weeklySeries.length === 0) return 0;
    const totalWeekly = weeklySeries.reduce((sum, w) => sum + w.value, 0);
    return Math.round(totalWeekly / weeklySeries.length);
  }, [weeklySeries]);

  // Monthly chart uses yearlyTransactions to be independent of date range filter
  const yearlyExpenses = useMemo(
    () => yearlyTransactions?.filter((t) => t.jenis?.toLowerCase() !== "pemasukan") || [],
    [yearlyTransactions]
  );
  const monthlySeries = useMemo(() => groupByMonthThisYear(yearlyExpenses), [yearlyExpenses]);

  const tooltipStyle = {
    background: "var(--tooltip-bg, #fff)",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12,
  };

  const charts = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* 1. Pengeluaran per Kategori */}
      <ChartCard title="Pengeluaran per Kategori" empty={byCategory.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {byCategory.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Pengeluaran per Sumber Dana */}
      <ChartCard title="Pengeluaran per Sumber Dana" empty={bySumber.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={bySumber}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {bySumber.map((_, i) => (
                <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Top 5 Pengeluaran */}
      <ChartCard title="Top 5 Pengeluaran" empty={topExpenses.length === 0}>
        <TopExpenseList data={topExpenses} />
      </ChartCard>

      {/* 4. Pengeluaran per Hari */}
      <ChartCard title="Pengeluaran per Hari" empty={dailyExpenses.length === 0}>
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Rata-rata: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatRupiah(dailyAverage)}</span> per hari
          </div>
          <div className="grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpenses}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#e11d48" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {/* 5. Pengeluaran per Minggu */}
      <ChartCard title="Pengeluaran per Minggu" empty={weeklySeries.length === 0}>
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Rata-rata: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatRupiah(weeklyAverage)}</span> per minggu
          </div>
          <div className="grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Pengeluaran" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>

      {/* 6. Pengeluaran per Bulan */}
      <ChartCard title="Pengeluaran per Bulan" empty={monthlySeries.length === 0}>
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Rata-rata: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatRupiah(monthlyAverage)}</span> per bulan
          </div>
          <div className="grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Pengeluaran" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartCard>
    </div>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-750"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        {expanded ? "Sembunyikan Chart" : "Tampilkan Chart"}
      </button>
      {expanded && charts}
    </div>
  );
}
