"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses/analytics";
import type { DailyFlow } from "@/lib/expenses/types";

export function CashFlowChart({ data }: { data: DailyFlow[] }) {
  const hasData = data.some((d) => d.expenses > 0 || d.income > 0);

  return (
    <Card className="border-white/10 bg-neutral-950 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-neutral-100">
          Cash flow
        </CardTitle>
        <p className="text-sm text-neutral-500">
          <span className="text-emerald-300">Income</span>
          {" · "}
          <span className="text-rose-300/90">Expenses</span>
        </p>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-neutral-500">
            No activity in this period
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <filter id="flowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#737373", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#fafafa",
                    fontSize: 12,
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
                  fill="rgba(251,113,133,0.55)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#incomeFill)"
                  style={{ filter: "url(#flowGlow)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
