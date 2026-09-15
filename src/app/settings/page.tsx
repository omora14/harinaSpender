import { redirect } from "next/navigation";
import {
  SettingsBackLink,
  SettingsClient,
} from "@/components/settings/settings-client";
import { toAmount } from "@/lib/expenses/analytics";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const settingsResult = await supabase
    .from("user_settings")
    .select("starting_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settingsResult.error) {
    console.error("user_settings query:", settingsResult.error.message);
  }

  let mfaEnabled = false;
  try {
    const { data: factors, error: mfaError } =
      await supabase.auth.mfa.listFactors();
    if (mfaError) {
      console.error("mfa.listFactors:", mfaError.message);
    } else {
      mfaEnabled =
        (factors?.totp?.filter((f) => f.status === "verified").length ?? 0) > 0;
    }
  } catch (err) {
    console.error("mfa.listFactors threw:", err);
  }

  return (
    <main className="min-h-dvh bg-neutral-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:max-w-3xl lg:px-10">
        <SettingsBackLink />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Balance, security, and exports
        </p>
        {settingsResult.error ? (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Could not load settings from the database. Run{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/002_user_settings.sql
            </code>{" "}
            in the Supabase SQL Editor, then refresh.
          </p>
        ) : null}
        <div className="mt-6">
          <SettingsClient
            email={user.email ?? ""}
            startingBalance={toAmount(
              settingsResult.data?.starting_balance ?? 0
            )}
            mfaEnabled={mfaEnabled}
          />
        </div>
      </div>
    </main>
  );
}
