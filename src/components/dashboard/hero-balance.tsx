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

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-5 py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
        Cash on hand
      </p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-neutral-50 tabular-nums sm:text-5xl">
        {formatCurrency(cashOnHand)}
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Starting {formatCurrency(metrics.startingBalance)} ± income & expenses
        (all time)
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] text-neutral-500">Income</p>
          <p className="mt-0.5 text-sm font-medium text-emerald-300 tabular-nums">
            +{formatCurrency(metrics.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">Spent</p>
          <p className="mt-0.5 text-sm font-medium text-rose-300 tabular-nums">
            −{formatCurrency(metrics.totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">Net</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-medium tabular-nums",
              netPositive ? "text-cyan-300" : "text-amber-300"
            )}
          >
            {netPositive ? "+" : ""}
            {formatCurrency(metrics.net)}
          </p>
        </div>
      </div>
    </section>
  );
}
