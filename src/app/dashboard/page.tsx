import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { HeroBalance } from "@/components/dashboard/hero-balance";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { TransactionList } from "@/components/dashboard/recent-transactions";
import {
  categoryBreakdown,
  computeCashOnHand,
  computeMetrics,
  dailyCashFlow,
  filterTransactions,
  periodBounds,
  toAmount,
  uniqueCategories,
} from "@/lib/expenses/analytics";
import type { PeriodKey, Transaction } from "@/lib/expenses/types";
import { createClient } from "@/lib/supabase/server";

const PERIODS = new Set<PeriodKey>(["7d", "30d", "month", "year", "all"]);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const periodRaw = param(params.period) || "month";
  const period: PeriodKey = PERIODS.has(periodRaw as PeriodKey)
    ? (periodRaw as PeriodKey)
    : "month";
  const category = param(params.category) || "all";
  const search = param(params.q);

  const [{ data: allRows }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, user_id, amount, category, note, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_settings")
      .select("starting_balance")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const startingBalance = toAmount(settingsRow?.starting_balance ?? 0);

  const allTransactions: Transaction[] = (allRows ?? []).map((row) => ({
    ...row,
    amount: toAmount(row.amount),
  }));

  const bounds = periodBounds(period);
  let periodTx = allTransactions;
  if (bounds.start && bounds.end) {
    const startMs = Date.parse(bounds.start);
    const endMs = Date.parse(bounds.end);
    periodTx = allTransactions.filter((tx) => {
      const t = Date.parse(tx.created_at);
      return t >= startMs && t <= endMs;
    });
  }

  const filtered = filterTransactions(periodTx, {
    category,
    search,
  });

  const cashOnHand = computeCashOnHand(allTransactions, startingBalance);
  const metrics = computeMetrics(filtered, startingBalance);
  // Period net/income/spend from filtered; cash on hand always all-time
  metrics.cashOnHand = cashOnHand;

  const categories = uniqueCategories(allTransactions);
  const breakdown = categoryBreakdown(filtered);

  const flowStart =
    bounds.start ??
    (allTransactions.length
      ? allTransactions[allTransactions.length - 1].created_at
      : new Date().toISOString());
  const flowEnd = bounds.end ?? new Date().toISOString();
  const cashFlow = dailyCashFlow(filtered, flowStart, flowEnd);

  return (
    <main className="min-h-dvh bg-neutral-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,_rgba(103,232,249,0.08),_transparent_60%)]"
      />
      <div className="relative mx-auto max-w-lg px-4 sm:max-w-3xl lg:max-w-5xl">
        <DashboardHeader
          categories={categories}
          activePeriod={period}
          activeCategory={category}
          search={search}
        />

        <div className="mt-5 space-y-5">
          <HeroBalance cashOnHand={cashOnHand} metrics={metrics} />
          <MetricCards metrics={metrics} />
          <div className="grid gap-5 lg:grid-cols-2">
            <CategoryDonut data={breakdown} />
            <CashFlowChart data={cashFlow} />
          </div>
          <TransactionList transactions={filtered} />
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-neutral-950 text-sm text-neutral-500">
          Loading dashboard…
        </main>
      }
    >
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
