import type { SupabaseClient } from "@supabase/supabase-js";

export type MfaRoute = "/dashboard" | "/mfa/enroll" | "/mfa/verify";

/**
 * Decide where an authenticated user should go for MFA.
 * - No verified TOTP factors → enroll
 * - Has factors but current AAL is aal1 → verify
 * - Otherwise → dashboard
 */
export async function resolveMfaDestination(
  supabase: SupabaseClient
): Promise<MfaRoute> {
  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    // If MFA APIs fail (e.g. not enabled), allow dashboard access.
    return "/dashboard";
  }

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verifiedTotp =
    factorsData?.totp?.filter((f) => f.status === "verified") ?? [];

  if (verifiedTotp.length === 0) {
    return "/mfa/enroll";
  }

  if (aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
    return "/mfa/verify";
  }

  return "/dashboard";
}
