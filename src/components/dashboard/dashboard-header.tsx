"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings } from "lucide-react";
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
    <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-neutral-950/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:mx-0 sm:rounded-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.2em] text-cyan-300/70 uppercase">
            Harina Spender
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-50">
            Dashboard
          </h1>
        </div>
        <Link
          href="/settings"
          className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Settings"
        >
          <Settings className="size-5" />
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => update({ period })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition",
              activePeriod === period
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            {PERIOD_LABELS[period]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="search"
          defaultValue={search}
          placeholder="Search notes…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-cyan-400/30"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update({ q: (e.target as HTMLInputElement).value });
            }
          }}
          onBlur={(e) => update({ q: e.target.value })}
        />
        <select
          value={activeCategory}
          onChange={(e) => update({ category: e.target.value })}
          className="h-11 max-w-[40%] rounded-xl border border-white/10 bg-neutral-950 px-2 text-sm text-neutral-200 outline-none"
          aria-label="Filter category"
        >
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
