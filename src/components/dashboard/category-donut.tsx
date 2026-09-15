"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { CategorySpend } from "@/lib/expenses/types";

const COLORS = [
  "#22d3ee",
  "#67e8f9",
  "#a5f3fc",
  "#e2e8f0",
  "#94a3b8",
  "#64748b",
  "#34d399",
  "#fb7185",
];

export function CategoryDonut({ data }: { data: CategorySpend[] }) {
  const chartData = data.map((d) => ({ name: d.category, value: d.total }));
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-white">Breakdown</h2>
        <p className="text-sm text-neutral-500">Expenses by category</p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-neutral-500">
          No expenses in this period
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative mx-auto h-[240px] w-full max-w-[280px] shrink-0 sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2.5}
                  stroke="#0a0a0a"
                  strokeWidth={3}
                  style={{ filter: "url(#donutGlow)" }}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fafafa",
                    fontSize: 12,
                  }}
                  formatter={(value) =>
                    formatCurrency(
                      typeof value === "number" ? value : Number(value)
                    )
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] text-neutral-500">Total</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-2.5">
            {chartData.slice(0, 7).map((item, index) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <li key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-neutral-300">
                      <span
                        className="inline-block size-2 shrink-0 rounded-full"
                        style={{ background: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-neutral-400">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
