"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Transaction } from "@/lib/expenses/types";

export function TransactionEditor({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!transaction || !open) return;
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setNote(transaction.note ?? "");
    setError(null);
    setConfirmDelete(false);
  }, [transaction, open]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) return;

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Amount must be a number greater than 0");
      return;
    }
    if (!category.trim()) {
      setError("Category is required");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        amount: Math.round(parsed * 100) / 100,
        category: category.trim(),
        note: note.trim() ? note.trim() : null,
      })
      .eq("id", transaction.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!transaction) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);

    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-white/10 bg-neutral-950 p-0 sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader className="space-y-1 border-b border-white/[0.06] px-5 py-4">
            <DialogTitle className="text-lg text-white">
              Edit transaction
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              {transaction
                ? format(parseISO(transaction.created_at), "MMM d, yyyy · h:mm a")
                : "Fix a mistake or remove this entry."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 border-white/10 bg-white/[0.03] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder='e.g. Coffee or "income"'
                className="h-11 border-white/10 bg-white/[0.03] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note</Label>
              <Input
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional"
                className="h-11 border-white/10 bg-white/[0.03] text-base"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 border-white/[0.06] bg-white/[0.02] sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={saving || deleting}
              onClick={handleDelete}
            >
              {deleting
                ? "Deleting…"
                : confirmDelete
                  ? "Tap again to confirm"
                  : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-white/10"
                disabled={saving || deleting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11" disabled={saving || deleting}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
