import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(103,232,249,0.1),_transparent_50%),radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.04),_transparent_45%)]"
      />
      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-neutral-950/80 p-6 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-medium tracking-[0.22em] text-cyan-300/80 uppercase">
            Harina Spender
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
            Your money, clearly
          </h1>
          <p className="text-sm leading-relaxed text-neutral-400">
            Sign in to track spending, income, and cash on hand — secured with
            two-factor authentication.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
