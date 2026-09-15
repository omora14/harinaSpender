import { Activity, Layers, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { DashboardMetrics } from "@/lib/expenses/types";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    {
      title: "Avg daily spend",
      value: formatCurrency(metrics.averageDailyExpenses),
      hint: "Across this period",
      icon: Activity,
    },
    {
      title: "Top category",
      value: metrics.topCategory ?? "—",
      hint: metrics.topCategory
        ? formatCurrency(metrics.topCategoryAmount)
        : "No expenses yet",
      icon: Layers,
    },
    {
      title: "Transactions",
      value: String(metrics.transactionCount),
      hint: "Matching filters",
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/15 hover:bg-white/[0.035]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                {item.title}
              </p>
              <span className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-neutral-500 transition group-hover:text-cyan-300">
                <Icon className="size-3.5" />
              </span>
            </div>
            <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-white">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-neutral-500">{item.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
