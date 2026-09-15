"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Settings, SlidersHorizontal } from "lucide-react";
import { PERIOD_LABELS } from "@/lib/expenses/analytics";
import type { PeriodKey } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

const PERIODS: PeriodKey[] = ["7d", "30d", "month", "year", "all"];

export function DashboardHeader({
  categories,
  activePeriod,
  activeCategory,
  search,
}: {
  categories: string[];
  activePeriod: PeriodKey;
  activeCategory: string;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
                Harina Spender
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Overview
            </h1>
          </div>
          <Link
            href="/settings"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => update({ period })}
                className={cn(
                  "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition",
                  activePeriod === period
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                {PERIOD_LABELS[period]}
              </button>
            ))}
          </div>

          <div className="flex gap-2 lg:min-w-[420px]">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-600" />
              <input
                type="search"
                defaultValue={search}
                placeholder="Search notes or categories…"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-10 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    update({ q: (e.target as HTMLInputElement).value });
                  }
                }}
                onBlur={(e) => update({ q: e.target.value })}
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-600" />
              <select
                value={activeCategory}
                onChange={(e) => update({ category: e.target.value })}
                className="h-11 appearance-none rounded-xl border border-white/10 bg-neutral-950 py-0 pr-8 pl-9 text-sm text-neutral-200 outline-none focus:border-cyan-400/40"
                aria-label="Filter category"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
