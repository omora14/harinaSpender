import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { DashboardMetrics } from "@/lib/expenses/types";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    {
      title: "Avg daily spend",
      value: formatCurrency(metrics.averageDailyExpenses),
      hint: "Expenses / days in range",
    },
    {
      title: "Top category",
      value: metrics.topCategory ?? "—",
      hint: metrics.topCategory
        ? formatCurrency(metrics.topCategoryAmount)
        : "No expenses",
    },
    {
      title: "Transactions",
      value: String(metrics.transactionCount),
      hint: "In selected period",
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible">
      {items.map((item) => (
        <Card
          key={item.title}
          className="min-w-[68%] shrink-0 border-white/10 bg-neutral-950 shadow-none sm:min-w-0"
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-neutral-500">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-semibold tracking-tight text-neutral-50">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-neutral-600">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
