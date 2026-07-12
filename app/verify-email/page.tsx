"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Footer from "../Footer";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user?.email_confirmed_at) {
        router.push(redirect || "/dashboard");
      } else {
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [router, redirect]);

  const checkConfirmed = async () => {
    setLoading(true);
    setError(null);
    const { data } = await supabase.auth.getUser();
    if (data.user?.email_confirmed_at) {
      router.push(redirect || "/dashboard");
      return;
    }
    setLoading(false);
  };

  const resendEmail = async () => {
    setError(null);
    setSent(false);
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) {
      setError("Could not find your email address. Please contact support.");
      return;
    }
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: data.user.email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setSent(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <p className="text-[var(--brand-muted)]">Checking verification status...</p>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="mb-6 text-center">
              <span className="badge-info mx-auto">Verify email</span>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                You must confirm your email address before accessing protected
                pages.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
              <p className="text-sm leading-6 text-[var(--brand-text)]">
                We sent a confirmation link to your email address. Click the
                link in the email to verify your account, then come back here.
              </p>
              <p className="mt-3 text-xs text-[var(--brand-muted)]">
                Didn&apos;t receive it? Check your spam folder or request a new
                link below.
              </p>
            </div>

            {sent && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Verification email sent. Check your inbox.
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={resendEmail}
              disabled={sent}
              className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sent ? "Email sent" : "Resend verification email"}
            </button>

            <button
              type="button"
              onClick={checkConfirmed}
              className="btn-secondary mt-3 w-full"
            >
              I&apos;ve confirmed my email
            </button>

            <Link
              href="/login"
              className="mt-4 block text-center text-sm font-bold text-[var(--brand-primary)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}