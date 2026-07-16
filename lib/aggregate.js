// Pure aggregation helpers for dashboard charts & summaries.
// Transactions: { tanggal, jenis, nominal, kategori, keterangan, source, createdBy }
import { parseTanggal, toISODate, formatShort, getWeekRange } from "./dates";
import { isIncome, categoryColor, OTHER_COLOR } from "./utils";

export function expensesOf(txs) {
  return txs.filter((t) => !isIncome(t));
}

export function sumNominal(txs) {
  return txs.reduce((s, t) => s + (t.nominal || 0), 0);
}

export function totalBetween(txs, startIso, endIso) {
  const start = startIso ? new Date(`${startIso}T00:00:00`) : null;
  const end = endIso ? new Date(`${endIso}T23:59:59`) : null;
  return sumNominal(
    txs.filter((t) => {
      const d = parseTanggal(t.tanggal);
      if (!d) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    })
  );
}

export function totalToday(txs) {
  const today = toISODate(new Date());
  return totalBetween(txs, today, today);
}

export function totalThisWeek(txs, weekStartDay = "monday") {
  const wk = getWeekRange(new Date(), weekStartDay);
  return totalBetween(txs, wk.start, wk.end);
}

// One bar per day across the range: [{ iso, label, value }]
export function dailySeries(txs, range) {
  const map = new Map();
  txs.forEach((t) => {
    const d = parseTanggal(t.tanggal);
    if (!d) return;
    const key = toISODate(d);
    map.set(key, (map.get(key) || 0) + (t.nominal || 0));
  });

  const start = range?.start ? new Date(`${range.start}T00:00:00`) : null;
  const end = range?.end ? new Date(`${range.end}T00:00:00`) : null;
  if (!start || !end || start > end) return [];

  const out = [];
  const cur = new Date(start);
  while (cur <= end) {
    const iso = toISODate(cur);
    out.push({ iso, label: formatShort(cur), value: map.get(iso) || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// 7-day chunks from the cycle start: [{ label: "W1", value }]
export function weekSeries(txs, range) {
  const days = dailySeries(txs, range);
  const out = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    out.push({
      label: `W${out.length + 1}`,
      value: chunk.reduce((s, d) => s + d.value, 0),
    });
  }
  return out;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// Last `count` calendar months ending this month: [{ label, value, current }]
export function monthlySeries(txs, count = 6) {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_SHORT[d.getMonth()],
      value: 0,
      current: i === 0,
    });
  }
  txs.forEach((t) => {
    const d = parseTanggal(t.tanggal);
    if (!d) return;
    const b = buckets.find(
      (x) => x.year === d.getFullYear() && x.month === d.getMonth()
    );
    if (b) b.value += t.nominal || 0;
  });
  return buckets.map(({ label, value, current }) => ({ label, value, current }));
}

// Share of total by any field, with palette + "Lainnya" tail: [{ name, value, pct, color }]
export function byField(txs, field, limit = 4) {
  const map = new Map();
  txs.forEach((t) => {
    const k = t[field] || "Tidak diketahui";
    map.set(k, (map.get(k) || 0) + (t.nominal || 0));
  });
  const sorted = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  let items = sorted;
  if (sorted.length > limit + 1) {
    const head = sorted.slice(0, limit);
    const tail = sorted.slice(limit).reduce((s, x) => s + x.value, 0);
    items = [...head, { name: "Lainnya", value: tail, other: true }];
  }
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  return items.map((x, i) => ({
    ...x,
    pct: Math.round((x.value / total) * 100),
    color: x.other ? OTHER_COLOR : categoryColor(x.name, i),
  }));
}

export function byCategory(txs, limit = 4) {
  return byField(txs, "kategori", limit);
}

export function bySource(txs, limit = 4) {
  return byField(txs, "source", limit);
}

// Biggest single expense transactions.
export function topSpending(txs, n = 5) {
  return [...txs]
    .sort((a, b) => (b.nominal || 0) - (a.nominal || 0))
    .slice(0, n);
}

// Group newest-first transactions by day with human labels.
export function groupByDay(txs) {
  const todayIso = toISODate(new Date());
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestIso = toISODate(yest);

  const groups = new Map();
  txs.forEach((t) => {
    const d = parseTanggal(t.tanggal);
    if (!d) return;
    const iso = toISODate(d);
    if (!groups.has(iso)) groups.set(iso, []);
    groups.get(iso).push(t);
  });

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([iso, items]) => {
      const d = new Date(`${iso}T00:00:00`);
      const label =
        iso === todayIso
          ? "Hari ini"
          : iso === yestIso
            ? "Kemarin"
            : `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      return { iso, label, items };
    });
}
