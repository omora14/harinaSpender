"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaVerifyForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data, error: listError } = await supabase.auth.mfa.listFactors();
        if (cancelled) return;

        if (listError) {
          setError(listError.message);
          setLoading(false);
          return;
        }

        const factor = data?.totp?.find((f) => f.status === "verified");
        if (!factor) {
          router.replace("/mfa/enroll");
          return;
        }

        setFactorId(factor.id);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load 2FA. Check Supabase env vars and try again."
        );
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) {
      setError("2FA is not ready yet. Refresh the page and try again.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const supabase = createClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error || !challenge.data) {
        setError(challenge.error?.message ?? "Challenge failed");
        return;
      }

      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });

      if (verified.error) {
        setError(verified.error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-neutral-400">Loading…</p>
    );
  }

  if (!factorId) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error ?? "Could not load your authenticator. Refresh or sign in again."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full border-white/10"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="mfa-code">6-digit code</Label>
        <Input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          pattern="[0-9]*"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="h-14 border-white/10 bg-white/[0.03] text-center font-mono text-2xl tracking-[0.35em]"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={verifying || code.length < 6}
      >
        {verifying ? "Checking…" : "Verify & continue"}
      </Button>
    </form>
  );
}
