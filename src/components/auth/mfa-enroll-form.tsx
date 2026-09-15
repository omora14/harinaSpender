"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaEnrollForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startEnroll() {
      try {
        const supabase = createClient();
        const { data: existing } = await supabase.auth.mfa.listFactors();
        const unverified = existing?.all?.find(
          (f) => f.factor_type === "totp" && f.status === "unverified"
        );
        if (unverified) {
          await supabase.auth.mfa.unenroll({ factorId: unverified.id });
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Authenticator",
        });

        if (cancelled) return;

        if (enrollError || !data) {
          setError(
            enrollError?.message ??
              "Could not start MFA enrollment. Enable TOTP in Supabase Auth settings."
          );
          setLoading(false);
          return;
        }

        setFactorId(data.id);
        setSecret(data.totp.secret);
        try {
          const url = await QRCode.toDataURL(data.totp.uri, {
            margin: 1,
            width: 220,
            color: { dark: "#fafafa", light: "#0a0a0a" },
          });
          setQrDataUrl(url);
        } catch {
          setQrDataUrl(null);
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not start MFA. Check Supabase env vars and try again."
        );
        setLoading(false);
      }
    }

    void startEnroll();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-center text-sm text-neutral-400">Preparing secure setup…</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="MFA QR code"
                className="rounded-xl border border-white/10 bg-black p-3"
              />
            ) : null}
            {secret ? (
              <p className="max-w-full break-all text-center font-mono text-xs text-neutral-500">
                Or enter manually: {secret}
              </p>
            ) : null}
          </div>

          <ol className="space-y-2 text-sm text-neutral-400">
            <li>1. Open Google Authenticator, 1Password, or Authy</li>
            <li>2. Scan the QR code</li>
            <li>3. Enter the 6-digit code below</li>
          </ol>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authentication code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
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
              {verifying ? "Verifying…" : "Enable 2FA & continue"}
            </Button>
          </form>
        </>
      )}
      {error && loading ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
