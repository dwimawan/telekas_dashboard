"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ReceiptText, BarChart3, User, RefreshCw } from "lucide-react";
import { cn, initialsOf } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard-provider";
import { FilterFields } from "@/components/widgets";

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];

// Insights duplicates the dashboard on desktop — mobile-only menu.
const DESKTOP_NAV = NAV.filter(({ href }) => href !== "/insights");

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-[15px] font-extrabold text-primary-foreground">
        T
      </div>
      <div className="text-[17px] font-extrabold">TeleKas</div>
    </div>
  );
}

// Filters only make sense where transaction data is shown
const FILTER_ROUTES = ["/", "/transactions"];

function DesktopSidebar() {
  const pathname = usePathname();
  const { currentUser, refresh, refreshing, resetFilters } = useDashboard();
  const showFilters = FILTER_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col gap-6 border-r border-secondary p-6 px-4 lg:flex">
      <Logo />
      <nav className="flex flex-col gap-1">
        {DESKTOP_NAV.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-bold transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-[3px]",
                  active ? "bg-primary" : "bg-[#3A3A3C]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      {showFilters && (
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-[14px] bg-card p-4">
          <div className="text-[13px] font-extrabold">Filter</div>
          <FilterFields />
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Reset filter
          </button>
        </div>
      )}
      <div className="mt-auto flex shrink-0 items-center gap-2.5 rounded-[14px] bg-card p-2.5 px-3">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-extrabold text-primary-foreground">
          {initialsOf(currentUser || "?")}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="truncate text-[13px] font-extrabold">
            {currentUser || "…"}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground">
            TeleKas
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          title="Refresh data"
          className="ml-auto rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex justify-center pb-5 lg:hidden">
      <div className="flex items-center gap-9 rounded-full border border-input bg-secondary/90 px-8 py-3.5 backdrop-blur-xl">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-label={label}>
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={active ? 2.4 : 2}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar />
      <main className="min-w-0 flex-1 px-5 pb-32 pt-6 lg:px-8 lg:pb-10 lg:pt-7">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

export function useLogout() {
  const router = useRouter();
  return async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };
}
