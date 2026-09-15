export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
};

export type CategorySpend = {
  category: string;
  total: number;
};

export type DailyFlow = {
  date: string;
  label: string;
  expenses: number;
  income: number;
  net: number;
};

export type PeriodKey = "7d" | "30d" | "month" | "year" | "all";

export type DashboardMetrics = {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  averageDailyExpenses: number;
  topCategory: string | null;
  topCategoryAmount: number;
  cashOnHand: number;
  startingBalance: number;
  transactionCount: number;
};

export type UserSettings = {
  user_id: string;
  starting_balance: number;
  created_at: string;
  updated_at: string;
};
