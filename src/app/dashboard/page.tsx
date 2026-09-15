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
    <main className="relative min-h-dvh bg-neutral-950 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,211,238,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(52,211,153,0.06),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />

      <div className="relative">
        <DashboardHeader
          categories={categories}
          activePeriod={period}
          activeCategory={category}
          search={search}
        />

        <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <HeroBalance cashOnHand={cashOnHand} metrics={metrics} />
          <MetricCards metrics={metrics} />

          <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr] xl:gap-6">
            <CashFlowChart data={cashFlow} />
            <CategoryDonut data={breakdown} />
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
