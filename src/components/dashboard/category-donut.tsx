"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { CategorySpend } from "@/lib/expenses/types";

const COLORS = [
  "#67e8f9",
  "#a5f3fc",
  "#e5e5e5",
  "#a3a3a3",
  "#737373",
  "#525252",
  "#86efac",
  "#fca5a5",
];

export function CategoryDonut({ data }: { data: CategorySpend[] }) {
  const chartData = data.map((d) => ({ name: d.category, value: d.total }));

  return (
    <Card className="border-white/10 bg-neutral-950 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-neutral-100">
          Expense breakdown
        </CardTitle>
        <p className="text-sm text-neutral-500">By category · income excluded</p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-neutral-500">
            No expenses in this period
          </div>
        ) : (
          <>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
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
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="#0a0a0a"
                    strokeWidth={2}
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
                      borderRadius: 10,
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
            </div>
            <ul className="mt-1 space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-2 text-sm"
                >
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
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
