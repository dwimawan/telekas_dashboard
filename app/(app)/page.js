"use client";

import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard-provider";
import { PeriodPill, MobileHeaderBar } from "@/components/widgets";
import { DailyBars, LabeledBars, CategoryDonut, TopSpendingList } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatRupiah, categoryEmoji } from "@/lib/utils";
import {
  expensesOf,
  sumNominal,
  totalToday,
  totalThisWeek,
  dailySeries,
  weekSeries,
  monthlySeries,
  byCategory,
  bySource,
  topSpending,
} from "@/lib/aggregate";

export default function DashboardPage() {
  const {
    filteredCycle,
    filteredWide,
    activeRange,
    loading,
    refreshing,
    error,
  } = useDashboard();

  const expenses = useMemo(() => expensesOf(filteredCycle), [filteredCycle]);
  const wideExpenses = useMemo(() => expensesOf(filteredWide), [filteredWide]);

  const spendToday = useMemo(() => totalToday(wideExpenses), [wideExpenses]);
  const spendWeek = useMemo(() => totalThisWeek(wideExpenses), [wideExpenses]);
  const spendCycle = useMemo(() => sumNominal(expenses), [expenses]);

  const months6 = useMemo(() => monthlySeries(wideExpenses, 6), [wideExpenses]);

  const daily = useMemo(() => dailySeries(expenses, activeRange), [expenses, activeRange]);
  const weeks = useMemo(() => weekSeries(expenses, activeRange), [expenses, activeRange]);
  const categoriesData = useMemo(() => byCategory(expenses), [expenses]);
  const sourcesData = useMemo(() => bySource(expenses), [expenses]);
  const top5 = useMemo(() => topSpending(expenses), [expenses]);

  if (loading || refreshing) return <DashboardSkeleton />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ============ Mobile (design 01) ============ */}
      <div className="flex flex-col gap-4 lg:hidden">
        <MobileHeaderBar />
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <div className="text-[13px] font-semibold text-muted-foreground">
            Total pengeluaran
          </div>
          <div className="text-[32px] font-extrabold tabular">
            {formatRupiah(spendCycle)}
          </div>
        </div>

        <DailyBars data={daily} height={118} />

        <Card className="rounded-card-lg">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="text-base font-extrabold">Top 5 pengeluaran</div>
            <TopSpendingList items={top5} />
          </CardContent>
        </Card>

        <Card className="rounded-card-lg">
          <CardContent className="flex flex-col gap-3.5 p-4">
            <div className="text-base font-extrabold">Pengeluaran per sumber dana</div>
            <CategoryDonut items={sourcesData} total={sumNominal(expenses)} size={110} />
          </CardContent>
        </Card>
      </div>

      {/* ============ Desktop (design 06, filters live in sidebar) ============ */}
      <div className="hidden flex-col gap-5 lg:flex">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[22px] font-extrabold">Dashboard</h1>
            <PeriodPill size="sm" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Pengeluaran hari ini" value={spendToday} />
            <StatCard label="Pengeluaran minggu ini" value={spendWeek} />
            <StatCard label="Pengeluaran bulan ini" value={spendCycle} accent />
          </div>

          <div className="grid grid-cols-[1.6fr_1fr] gap-4">
            <div className="flex min-w-0 flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pengeluaran harian</CardTitle>
                  <CardDescription>
                    {daily[0]?.label} — {daily[daily.length - 1]?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyBars data={daily} height={150} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex gap-6">
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="text-[15px] font-extrabold">Per minggu</div>
                    <LabeledBars data={weeks} highlight="max" height={130} />
                  </div>
                  <Separator orientation="vertical" className="h-auto" />
                  <div className="flex flex-[1.4] flex-col gap-3">
                    <div className="text-[15px] font-extrabold">Per bulan</div>
                    <LabeledBars data={months6} highlight="current" height={130} />
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex flex-col gap-3">
                  <div className="text-[15px] font-extrabold">Top 5 pengeluaran</div>
                  <TopSpendingList items={top5} />
                </CardContent>
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <Card className="flex-1">
                <CardContent className="flex h-full flex-col justify-center gap-3.5">
                  <div className="text-[15px] font-extrabold">Pengeluaran per kategori</div>
                  <CategoryDonut
                    items={categoriesData}
                    total={sumNominal(expenses)}
                    size={110}
                    emojiFor={categoryEmoji}
                  />
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex h-full flex-col justify-center gap-3.5">
                  <div className="text-[15px] font-extrabold">Pengeluaran per sumber dana</div>
                  <CategoryDonut items={sourcesData} total={sumNominal(expenses)} size={110} />
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 px-5 py-[18px]">
        <div className="text-[13px] font-semibold text-muted-foreground">{label}</div>
        <div className={`text-[26px] font-extrabold tabular ${accent ? "text-primary" : ""}`}>
          {formatRupiah(value)}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-full" />
        <Skeleton className="hidden h-9 w-64 rounded-full lg:block" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </div>
  );
}
