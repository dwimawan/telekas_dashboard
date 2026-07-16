"use client";

import { ChevronRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard-provider";
import { useLogout } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { initialsOf, categoryColor } from "@/lib/utils";

const WEEKDAY_LABELS = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

export default function ProfilePage() {
  const { currentUser, monthlyStartDay, allCategories } = useDashboard();
  const logout = useLogout();

  const weekStart =
    WEEKDAY_LABELS[
      String(process.env.NEXT_PUBLIC_WEEK_START_DAY || "monday").toLowerCase()
    ] || "Senin";

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-center gap-2.5 pt-4">
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-primary text-[26px] font-extrabold text-primary-foreground">
          {initialsOf(currentUser || "?")}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="text-xl font-extrabold">{currentUser || "…"}</div>
          <div className="text-[13px] font-semibold text-muted-foreground">TeleKas</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="pl-1 text-[13px] font-bold text-muted-foreground">Preferensi</div>
        <Card className="overflow-hidden rounded-card-lg">
          <div className="flex items-center gap-3 p-4">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="text-[15px] font-bold">Awal periode bulanan</div>
              <div className="text-xs font-semibold text-muted-foreground">
                Siklus bulan mulai tanggal {monthlyStartDay}
              </div>
            </div>
            <div className="rounded-full bg-secondary px-3.5 py-1.5 text-[13px] font-extrabold text-primary">
              Tanggal {monthlyStartDay}
            </div>
          </div>
          <Separator className="ml-4 w-auto" />
          <div className="flex items-center gap-3 p-4">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="text-[15px] font-bold">Awal minggu</div>
              <div className="text-xs font-semibold text-muted-foreground">
                Hari pertama dalam seminggu
              </div>
            </div>
            <div className="rounded-full bg-secondary px-3.5 py-1.5 text-[13px] font-extrabold text-primary">
              {weekStart}
            </div>
          </div>
          <Separator className="ml-4 w-auto" />
          <div className="flex items-center gap-3 p-4">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="text-[15px] font-bold">Kategori</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {allCategories.length} kategori dari TeleKas Bot
              </div>
            </div>
            <div className="flex gap-1">
              {allCategories.slice(0, 4).map((c) => (
                <span
                  key={c}
                  title={c}
                  className="h-2.5 w-2.5 rounded-[3px]"
                  style={{ background: categoryColor(c) }}
                />
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-faint" />
          </div>
        </Card>
      </div>

      <Card className="rounded-card-lg">
        <button
          type="button"
          onClick={logout}
          className="w-full p-4 text-center text-[15px] font-extrabold text-destructive"
        >
          Keluar
        </button>
      </Card>

      <div className="text-center text-xs font-semibold text-faint">TeleKas · v2.0</div>
    </div>
  );
}
