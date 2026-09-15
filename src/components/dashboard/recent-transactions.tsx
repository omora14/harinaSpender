"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";
import { TransactionEditor } from "@/components/dashboard/transaction-editor";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  isIncome,
  toAmount,
} from "@/lib/expenses/analytics";
import type { Transaction } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

const PAGE = 25;

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const slice = useMemo(
    () => transactions.slice(0, visible),
    [transactions, visible]
  );

  function openEditor(tx: Transaction) {
    setSelected(tx);
    setEditorOpen(true);
  }

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-end justify-between gap-3 border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-medium text-white">Activity</h2>
          <p className="text-sm text-neutral-500">
            {transactions.length} transaction
            {transactions.length === 1 ? "" : "s"} in view · tap to edit
          </p>
        </div>
      </div>

      {slice.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-neutral-500">
          Nothing matches these filters. Log expenses or income via Shortcut.
        </p>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] text-xs tracking-wide text-neutral-500 uppercase">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Note</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 text-right font-medium">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {slice.map((tx) => {
                  const income = isIncome(tx.category);
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap text-neutral-400">
                        {format(parseISO(tx.created_at), "MMM d, yyyy · h:mm a")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            income
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/[0.04] text-neutral-200"
                          )}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td className="max-w-[320px] truncate px-6 py-3.5 text-neutral-500">
                        {tx.note ?? "—"}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-3.5 text-right font-medium tabular-nums",
                          income ? "text-emerald-300" : "text-white"
                        )}
                      >
                        {income ? "+" : "−"}
                        {formatCurrency(toAmount(tx.amount))}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-neutral-400 hover:text-white"
                          aria-label={`Edit ${tx.category}`}
                          onClick={() => openEditor(tx)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-white/[0.04] md:hidden">
            {slice.map((tx) => {
              const income = isIncome(tx.category);
              return (
                <li key={tx.id}>
                  <button
                    type="button"
                    onClick={() => openEditor(tx)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition active:bg-white/[0.04]"
                  >
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                        income
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-rose-400/10 text-rose-300"
                      )}
                    >
                      {income ? "+" : "−"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-100">
                        {tx.category}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {format(parseISO(tx.created_at), "MMM d · h:mm a")}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p
                        className={cn(
                          "font-medium tabular-nums",
                          income ? "text-emerald-300" : "text-white"
                        )}
                      >
                        {income ? "+" : "−"}
                        {formatCurrency(toAmount(tx.amount))}
                      </p>
                      <Pencil className="size-3.5 text-neutral-600" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {visible < transactions.length ? (
        <div className="border-t border-white/[0.06] p-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-white/10"
            onClick={() => setVisible((v) => v + PAGE)}
          >
            Load more ({transactions.length - visible} left)
          </Button>
        </div>
      ) : null}

      <TransactionEditor
        transaction={selected}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
