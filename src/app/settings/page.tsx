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

  const [{ data: settings }, { data: factors }] = await Promise.all([
    supabase
      .from("user_settings")
      .select("starting_balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.auth.mfa.listFactors(),
  ]);

  const mfaEnabled =
    (factors?.totp?.filter((f) => f.status === "verified").length ?? 0) > 0;

  return (
    <main className="min-h-dvh bg-neutral-950 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg px-4 py-6">
        <SettingsBackLink />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Balance, security, and exports
        </p>
        <div className="mt-6">
          <SettingsClient
            email={user.email ?? ""}
            startingBalance={toAmount(settings?.starting_balance ?? 0)}
            mfaEnabled={mfaEnabled}
          />
        </div>
      </div>
    </main>
  );
}
