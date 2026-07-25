"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Link from "next/link";
import Footer from "@/app/Footer";
import ErrorMessage from "@/app/ErrorMessage";

type ForgotState = "form" | "sent";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ForgotState>("form");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setState("sent");
  };

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            {state === "form" ? (
              <>
                <div className="mb-6 text-center">
                  <span className="badge-info mx-auto">Reset password</span>
                  <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                    Forgot your password?
                  </h1>
                  <p className="mt-2 text-sm text-[var(--brand-muted)]">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <ErrorMessage message={error} className="mb-4" />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      autoComplete="email"
                    />
                  </div>

                  <ErrorMessage message={error} />

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full disabled:cursor-wait"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
                  Remember your password?{" "}
                  <Link href="/" className="font-bold text-[var(--brand-primary)] hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h1 className="mt-4 text-2xl font-extrabold text-[var(--brand-text)]">
                    Check your inbox
                  </h1>
                  <p className="mt-2 text-sm text-[var(--brand-muted)]">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>.
                    The link expires in 1 hour.
                  </p>
                </div>

                <div className="space-y-3">
                   <Link href="/" className="btn-primary w-full block text-center">
                     Back to sign in
                   </Link>
                  <button
                    type="button"
                    onClick={() => setState("form")}
                    className="btn-secondary w-full"
                  >
                    Resend email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}