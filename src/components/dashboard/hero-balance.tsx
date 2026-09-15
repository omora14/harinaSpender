import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { DashboardMetrics } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

export function HeroBalance({
  cashOnHand,
  metrics,
}: {
  cashOnHand: number;
  metrics: DashboardMetrics;
}) {
  const netPositive = metrics.net >= 0;
  const totalFlow = metrics.totalIncome + metrics.totalExpenses;
  const spendShare =
    totalFlow > 0 ? (metrics.totalExpenses / totalFlow) * 100 : 0;
  const incomeShare =
    totalFlow > 0 ? (metrics.totalIncome / totalFlow) * 100 : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.06)_0%,rgba(10,10,10,0.4)_45%,rgba(8,47,73,0.25)_100%)] p-6 sm:p-8 lg:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-10 size-64 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-neutral-400 backdrop-blur">
            <Wallet className="size-3.5 text-cyan-300" />
            Cash on hand · all time
          </div>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-white tabular-nums sm:text-6xl lg:text-7xl">
            {formatCurrency(cashOnHand)}
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
            Starting balance {formatCurrency(metrics.startingBalance)} plus all
            logged income, minus every expense.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Income"
              value={`+${formatCurrency(metrics.totalIncome)}`}
              tone="income"
              icon={<TrendingUp className="size-3.5" />}
            />
            <Stat
              label="Spent"
              value={`−${formatCurrency(metrics.totalExpenses)}`}
              tone="spend"
              icon={<TrendingDown className="size-3.5" />}
            />
            <Stat
              label="Net"
              value={`${netPositive ? "+" : ""}${formatCurrency(metrics.net)}`}
              tone={netPositive ? "net-pos" : "net-neg"}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Period mix</span>
              <span>
                {incomeShare.toFixed(0)}% in · {spendShare.toFixed(0)}% out
              </span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="bg-emerald-400/80 transition-all"
                style={{ width: `${incomeShare}%` }}
              />
              <div
                className="bg-rose-400/70 transition-all"
                style={{ width: `${spendShare}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "income" | "spend" | "net-pos" | "net-neg";
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/25 px-3 py-3 backdrop-blur-sm">
      <p className="flex items-center gap-1 text-[11px] text-neutral-500">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-semibold tabular-nums sm:text-base",
          tone === "income" && "text-emerald-300",
          tone === "spend" && "text-rose-300",
          tone === "net-pos" && "text-cyan-300",
          tone === "net-neg" && "text-amber-300"
        )}
      >
        {value}
      </p>
    </div>
  );
}
