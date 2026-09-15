"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/expenses/analytics";

export function SettingsClient({
  email,
  startingBalance,
  mfaEnabled,
}: {
  email: string;
  startingBalance: number;
  mfaEnabled: boolean;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(String(startingBalance));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveBalance(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const parsed = Number(balance);
    if (!Number.isFinite(parsed)) {
      setError("Enter a valid number");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        starting_balance: Math.round(parsed * 100) / 100,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      setError(upsertError.message);
    } else {
      setMessage(`Saved starting balance ${formatCurrency(parsed)}`);
      router.refresh();
    }
    setSaving(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-medium text-neutral-300">Account</h2>
        <p className="text-sm text-neutral-500">{email}</p>
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck
            className={
              mfaEnabled ? "size-4 text-emerald-400" : "size-4 text-amber-400"
            }
          />
          <span className="text-neutral-300">
            {mfaEnabled ? "2FA enabled" : "2FA not set up"}
          </span>
        </div>
        {!mfaEnabled ? (
          <Link
            href="/mfa/enroll"
            className="inline-block text-sm text-cyan-300 underline-offset-4 hover:underline"
          >
            Set up two-factor authentication
          </Link>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <h2 className="text-sm font-medium text-neutral-300">
            Starting balance
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Optional base cash. Cash on hand = this + all income − all expenses.
            Adjust when money arrives outside the app.
          </p>
        </div>
        <form onSubmit={saveBalance} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="starting">Amount (USD)</Label>
            <Input
              id="starting"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="h-12 border-white/10 bg-black/40 text-base"
            />
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-400" role="status">
              {message}
            </p>
          ) : null}
          <Button type="submit" className="h-11 w-full" disabled={saving}>
            {saving ? "Saving…" : "Save balance"}
          </Button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-medium text-neutral-300">Export</h2>
        <p className="text-sm text-neutral-500">
          Download every transaction as CSV for spreadsheets or backups.
        </p>
        <a href="/api/export/csv" download>
          <Button type="button" variant="outline" className="h-11 w-full border-white/10">
            <Download className="size-4" />
            Export CSV
          </Button>
        </a>
      </section>

      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full text-neutral-400"
        onClick={signOut}
      >
        Sign out
      </Button>
    </div>
  );
}

export function SettingsBackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
    >
      <ArrowLeft className="size-4" />
      Back to dashboard
    </Link>
  );
}
