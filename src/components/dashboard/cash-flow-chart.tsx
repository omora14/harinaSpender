"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { DailyFlow } from "@/lib/expenses/types";

export function CashFlowChart({ data }: { data: DailyFlow[] }) {
  const hasData = data.some((d) => d.expenses > 0 || d.income > 0);
 
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-white">Cash flow</h2>
          <p className="text-sm text-neutral-500">Income vs expenses over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400" />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-400/80" />
            Expenses
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-neutral-500">
          No activity in this period
        </div>
      ) : (
        <div className="mt-2 h-[280px] w-full sm:h-[320px] lg:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.35} />
                </linearGradient>
                <filter id="flowGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
                strokeDasharray="4 8"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                dy={6}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                }
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fafafa",
                  fontSize: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                }}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as DailyFlow | undefined;
                  return point?.date ?? "";
                }}
                formatter={(value, name) => [
                  formatCurrency(
                    typeof value === "number" ? value : Number(value)
                  ),
                  name === "income" ? "Income" : "Expenses",
                ]}
              />
              <Bar
                dataKey="expenses"
                fill="url(#expenseBar)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#34d399"
                strokeWidth={2.5}
                fill="url(#incomeFill)"
                style={{ filter: "url(#flowGlow)" }}
                activeDot={{
                  r: 5,
                  fill: "#ecfdf5",
                  stroke: "#34d399",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
