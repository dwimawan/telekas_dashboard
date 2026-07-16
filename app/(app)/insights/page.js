"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard-provider";
import { PeriodPill } from "@/components/widgets";
import { LabeledBars, CategoryDonut } from "@/components/charts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiahCompact, categoryEmoji } from "@/lib/utils";
import {
  expensesOf,
  sumNominal,
  weekSeries,
  monthlySeries,
  byCategory,
  bySource,
} from "@/lib/aggregate";

export default function InsightsPage() {
  const { filteredCycle, filteredWide, activeRange, loading, refreshing, error } = useDashboard();

  const expenses = useMemo(() => expensesOf(filteredCycle), [filteredCycle]);
  const wideExpenses = useMemo(() => expensesOf(filteredWide), [filteredWide]);

  const categoriesData = useMemo(() => byCategory(expenses), [expenses]);
  const sourcesData = useMemo(() => bySource(expenses), [expenses]);
  const weeks = useMemo(() => weekSeries(expenses, activeRange), [expenses, activeRange]);
  const months6 = useMemo(() => monthlySeries(wideExpenses, 6), [wideExpenses]);

  const weekAvg = weeks.length
    ? Math.round(weeks.reduce((s, w) => s + w.value, 0) / weeks.length)
    : 0;

  if (loading || refreshing) return <InsightsSkeleton />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {/* Desktop: insights merged into dashboard — page kept for mobile */}
      <div className="hidden py-16 text-center text-sm text-muted-foreground lg:block">
        Di desktop, semua insight sudah tersedia di{" "}
        <Link href="/" className="font-bold text-primary hover:underline">
          Dashboard
        </Link>
        .
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Insights</h1>
        <PeriodPill size="sm" />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="rounded-card-lg">
        <CardContent className="flex flex-col gap-3.5 p-4">
          <div className="text-[15px] font-extrabold">Pengeluaran per kategori</div>
          <CategoryDonut
            items={categoriesData}
            total={sumNominal(expenses)}
            size={130}
            emojiFor={categoryEmoji}
          />
        </CardContent>
      </Card>

      <Card className="rounded-card-lg">
        <CardContent className="flex flex-col gap-3.5 p-4">
          <div className="text-[15px] font-extrabold">Pengeluaran per sumber dana</div>
          <CategoryDonut items={sourcesData} total={sumNominal(expenses)} size={130} />
        </CardContent>
      </Card>

      <Card className="rounded-card-lg">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-extrabold">Pengeluaran per minggu</div>
            <div className="text-[11px] font-bold text-muted-foreground">
              rata-rata Rp{formatRupiahCompact(weekAvg)}
            </div>
          </div>
          <LabeledBars data={weeks} highlight="max" height={110} />
        </CardContent>
      </Card>

      <Card className="rounded-card-lg">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-extrabold">Pengeluaran per bulan</div>
            <div className="text-[11px] font-bold text-muted-foreground">6 bulan terakhir</div>
          </div>
          <LabeledBars data={months6} highlight="current" height={110} />
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Skeleton className="h-9 w-40 rounded-full" />
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-card-lg" />
      ))}
    </div>
  );
}
