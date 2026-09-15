import { MfaEnrollForm } from "@/components/auth/mfa-enroll-form";

export default function MfaEnrollPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(103,232,249,0.08),_transparent_55%)]"
      />
      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-neutral-950/80 p-6 backdrop-blur-xl sm:p-8">
        <div className="space-y-2 text-center">
          <p className="text-[11px] font-medium tracking-[0.22em] text-cyan-300/80 uppercase">
            Security
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
            Set up 2FA
          </h1>
          <p className="text-sm text-neutral-400">
            One quick scan. Required on every sign-in after this.
          </p>
        </div>
        <MfaEnrollForm />
      </div>
    </main>
  );
}
