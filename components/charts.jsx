"use client";

import { useState } from "react";
import { cn, formatRupiah, formatRupiahCompact } from "@/lib/utils";
import { toISODate } from "@/lib/dates";
import { TxAvatar, TxAmount } from "@/components/widgets";

const INACTIVE_BAR = "#3A3A3C";

// Dense daily bars (design's "Daily spending"): today = white, rest = accent.
export function DailyBars({ data, height = 130, className }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const todayIso = toISODate(new Date());

  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  return (
    <div className={className}>
      <div className="relative flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={d.iso || i}
            className="group relative flex-1 cursor-pointer"
            style={{
              height: `${Math.max(2, Math.round((d.value / max) * 100))}%`,
              background: d.iso === todayIso ? "#fff" : "var(--primary)",
              borderRadius: "3px 3px 1px 1px",
              opacity: hover == null || hover === i ? 1 : 0.45,
            }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && d.value > 0 && (
              <div className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-pill px-2 py-1 text-[11px] font-bold text-pill-foreground">
                {d.label} · {formatRupiah(d.value)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

// Wide labeled bars (week / month): value above, label below, highlight = accent.
export function LabeledBars({ data, height = 110, highlight = "last", className }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <EmptyChart height={height} />;

  const isHighlighted = (d, i) => {
    if (highlight === "last") return i === data.length - 1;
    if (highlight === "max") return d.value === max;
    return d.current;
  };

  return (
    <div className={cn("flex items-end gap-3", className)} style={{ height }}>
      {data.map((d, i) => {
        const hl = isHighlighted(d, i);
        return (
          <div key={d.label + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="whitespace-nowrap text-[10px] font-extrabold"
              style={{ color: hl ? "#fff" : "var(--muted-foreground)" }}
            >
              {formatRupiahCompact(d.value)}
            </div>
            <div
              className="w-full"
              style={{
                height: `${Math.max(3, Math.round((d.value / max) * 72))}%`,
                background: hl ? "var(--primary)" : INACTIVE_BAR,
                borderRadius: "6px 6px 2px 2px",
              }}
            />
            <div className="text-[11px] font-bold text-muted-foreground">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Conic-gradient donut with legend (design's "Expense by category").
export function CategoryDonut({ items, total, size = 120, emojiFor }) {
  if (items.length === 0) return <EmptyChart height={size} />;

  let acc = 0;
  const stops = items.map((it) => {
    const s = `${it.color} ${acc}% ${acc + it.pct}%`;
    acc += it.pct;
    return s;
  });
  // close any rounding gap with the last color
  if (acc < 100 && items.length) stops.push(`${items[items.length - 1].color} ${acc}% 100%`);

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative shrink-0 rounded-full"
        style={{ width: size, height: size, background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full bg-card">
          <div className="text-[10px] font-bold text-muted-foreground">Total</div>
          <div className="text-[13px] font-extrabold">Rp{formatRupiahCompact(total)}</div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: it.color }} />
            {emojiFor && !it.other ? (
              <span className="emoji-bounce shrink-0 text-sm" aria-hidden="true">
                {emojiFor(it.name)}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-secondary-foreground">
              {it.name}
            </span>
            <span className="text-xs font-extrabold text-muted-foreground">{it.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ranked list of biggest expenses (design's "Top 5 spending").
export function TopSpendingList({ items }) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Tidak ada data
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((tx, i) => (
        <div key={tx.id ?? i} className="flex items-center gap-3">
          <div className="w-5 text-[13px] font-extrabold text-faint">{i + 1}</div>
          <TxAvatar tx={tx} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="truncate text-[15px] font-bold">
              {tx.keterangan || tx.kategori || "Pengeluaran"}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">{tx.kategori}</div>
          </div>
          <TxAmount tx={tx} className="text-[15px]" />
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ height }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      Tidak ada data
    </div>
  );
}
