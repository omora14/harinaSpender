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
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      const factor = data?.totp?.find((f) => f.status === "verified");
      if (!factor) {
        router.replace("/mfa/enroll");
        return;
      }
      setFactorId(factor.id);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setVerifying(true);
    const supabase = createClient();

    try {
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
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-neutral-400">Loading…</p>
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
