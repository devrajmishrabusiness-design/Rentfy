"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../Footer";
import ErrorMessage from "../ErrorMessage";

/**
 * Signup page.
 *
 * This page ONLY creates the Supabase auth account (email + password).
 * It does NOT create an agency profile. After the user verifies their
 * email and is signed in, they are redirected to /onboarding/agency
 * which collects the agency fields and creates the row through RLS.
 *
 * No service-role writes, no client-supplied auth_user_id.
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setVerifyEmailAddress(email);
    setLoading(false);
  };

  if (verifyEmailAddress) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card p-8">
              <div className="mb-6 text-center">
                <span className="badge-info mx-auto">Verify email</span>
                <h1 className="mt-3 text-2xl font-extrabold text-[var(--brand-text)]">
                  Check your inbox
                </h1>
                <p className="mt-2 text-sm text-[var(--brand-muted)]">
                  We sent a confirmation link to{" "}
                  <strong>{verifyEmailAddress}</strong>. Click the link to
                  activate your account, then sign in to complete agency
                  onboarding.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
                <p className="text-sm leading-6 text-[var(--brand-text)]">
                  After verifying, sign in and you&apos;ll be asked for your
                  agency name, owner name, phone, and city. Listings go live
                  after our team reviews your agency.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="btn-primary mt-4 w-full"
              >
                Go to sign in
              </button>
            </div>
          </div>
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
              <span className="badge-info mx-auto">Join Rentfy</span>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                Verify your email, then complete agency onboarding in one
                short step.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                />
              </div>

              <ErrorMessage message={error} />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:cursor-wait"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[var(--brand-primary)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
