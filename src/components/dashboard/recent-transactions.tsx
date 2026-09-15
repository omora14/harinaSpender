"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  isIncome,
  toAmount,
} from "@/lib/expenses/analytics";
import type { Transaction } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

const PAGE = 20;

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [visible, setVisible] = useState(PAGE);
  const slice = useMemo(
    () => transactions.slice(0, visible),
    [transactions, visible]
  );

  return (
    <Card className="border-white/10 bg-neutral-950 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-neutral-100">
          Activity
        </CardTitle>
        <p className="text-sm text-neutral-500">
          {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="space-y-1 px-2 sm:px-4">
        {slice.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            Nothing matches these filters. Log expenses or income via Shortcut.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {slice.map((tx) => {
              const income = isIncome(tx.category);
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 px-2 py-3.5 sm:px-0"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      income
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-rose-400/10 text-rose-300"
                    )}
                  >
                    {income ? "+" : "−"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-100">
                      {tx.category}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {format(parseISO(tx.created_at), "MMM d · h:mm a")}
                      {tx.note ? ` · ${tx.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-sm font-medium tabular-nums",
                      income ? "text-emerald-300" : "text-neutral-100"
                    )}
                  >
                    {income ? "+" : "−"}
                    {formatCurrency(toAmount(tx.amount))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {visible < transactions.length ? (
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-11 w-full border-white/10"
            onClick={() => setVisible((v) => v + PAGE)}
          >
            Load more ({transactions.length - visible} left)
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
