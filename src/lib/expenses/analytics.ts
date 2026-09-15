import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import type {
  CategorySpend,
  DailyFlow,
  DashboardMetrics,
  PeriodKey,
  Transaction,
} from "./types";

export function toAmount(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function isIncome(category: string): boolean {
  return category.trim().toLowerCase() === "income";
}

export function expensesOnly(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => !isIncome(tx.category));
}

export function incomeOnly(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => isIncome(tx.category));
}

export function periodBounds(period: PeriodKey, now = new Date()) {
  const end = endOfDay(now);
  switch (period) {
    case "7d":
      return { start: startOfDay(subDays(now, 6)).toISOString(), end: end.toISOString() };
    case "30d":
      return { start: startOfDay(subDays(now, 29)).toISOString(), end: end.toISOString() };
    case "month":
      return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString(),
      };
    case "year":
      return {
        start: startOfYear(now).toISOString(),
        end: endOfYear(now).toISOString(),
      };
    case "all":
      return { start: null as string | null, end: null as string | null };
  }
}

export function filterTransactions(
  transactions: Transaction[],
  opts: {
    category?: string | null;
    search?: string | null;
  }
): Transaction[] {
  const category = opts.category?.trim().toLowerCase();
  const search = opts.search?.trim().toLowerCase();

  return transactions.filter((tx) => {
    if (category && category !== "all") {
      if (tx.category.trim().toLowerCase() !== category) return false;
    }
    if (search) {
      const hay = `${tx.note ?? ""} ${tx.category}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

export function computeMetrics(
  transactions: Transaction[],
  startingBalance: number,
  now = new Date()
): DashboardMetrics {
  const incomeTx = incomeOnly(transactions);
  const expenseTx = expensesOnly(transactions);

  const totalIncome = incomeTx.reduce((s, tx) => s + toAmount(tx.amount), 0);
  const totalExpenses = expenseTx.reduce((s, tx) => s + toAmount(tx.amount), 0);
  const net = totalIncome - totalExpenses;

  const daySpan = Math.max(
    1,
    Math.ceil(
      (now.getTime() -
        (transactions.length
          ? Math.min(...transactions.map((t) => parseISO(t.created_at).getTime()))
          : now.getTime())) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
  const averageDailyExpenses = totalExpenses / daySpan;

  const byCategory = new Map<string, number>();
  for (const tx of expenseTx) {
    byCategory.set(
      tx.category,
      (byCategory.get(tx.category) ?? 0) + toAmount(tx.amount)
    );
  }

  let topCategory: string | null = null;
  let topCategoryAmount = 0;
  for (const [category, total] of byCategory) {
    if (total > topCategoryAmount) {
      topCategory = category;
      topCategoryAmount = total;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    net,
    averageDailyExpenses,
    topCategory,
    topCategoryAmount,
    cashOnHand: startingBalance + totalIncome - totalExpenses,
    startingBalance,
    transactionCount: transactions.length,
  };
}

/** Cash on hand using ALL transactions (not period-filtered). */
export function computeCashOnHand(
  allTransactions: Transaction[],
  startingBalance: number
): number {
  let income = 0;
  let expenses = 0;
  for (const tx of allTransactions) {
    const amt = toAmount(tx.amount);
    if (isIncome(tx.category)) income += amt;
    else expenses += amt;
  }
  return startingBalance + income - expenses;
}

export function categoryBreakdown(
  transactions: Transaction[]
): CategorySpend[] {
  const byCategory = new Map<string, number>();
  for (const tx of expensesOnly(transactions)) {
    byCategory.set(
      tx.category,
      (byCategory.get(tx.category) ?? 0) + toAmount(tx.amount)
    );
  }

  return Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function dailyCashFlow(
  transactions: Transaction[],
  startIso: string,
  endIso: string
): DailyFlow[] {
  const start = startOfDay(parseISO(startIso));
  const end = endOfDay(parseISO(endIso));
  const days = eachDayOfInterval({ start, end });

  const expenseByDay = new Map<string, number>();
  const incomeByDay = new Map<string, number>();

  for (const tx of transactions) {
    const key = format(parseISO(tx.created_at), "yyyy-MM-dd");
    const amt = toAmount(tx.amount);
    if (isIncome(tx.category)) {
      incomeByDay.set(key, (incomeByDay.get(key) ?? 0) + amt);
    } else {
      expenseByDay.set(key, (expenseByDay.get(key) ?? 0) + amt);
    }
  }

  // Cap chart points for year/all views
  const maxPoints = 62;
  const step = Math.max(1, Math.ceil(days.length / maxPoints));
  const sampled = days.filter((_, i) => i % step === 0 || i === days.length - 1);

  return sampled.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const expenses = expenseByDay.get(key) ?? 0;
    const income = incomeByDay.get(key) ?? 0;
    return {
      date: key,
      label: format(day, days.length > 40 ? "MMM d" : "d"),
      expenses,
      income,
      net: income - expenses,
    };
  });
}

export function uniqueCategories(transactions: Transaction[]): string[] {
  return Array.from(
    new Set(transactions.map((tx) => tx.category.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7d": "7D",
  "30d": "30D",
  month: "Month",
  year: "Year",
  all: "All",
};
