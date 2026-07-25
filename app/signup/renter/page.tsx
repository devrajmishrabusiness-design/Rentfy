"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/app/Footer";
import ErrorMessage from "@/app/ErrorMessage";

type Step = "form" | "verify";

export default function RenterSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Full name is required");
      return;
    }
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      setError("Please enter a valid contact number");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          role: "renter",
          full_name: fullName.trim(),
          phone_number: phone.trim(),
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      if (message.includes("already") || message.includes("exists") || message.includes("duplicate")) {
        setError("An account with this email already exists. Please log in instead.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      setStep("verify");
    } else {
      router.push("/renter");
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
    }
  };

  if (step === "verify") {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <span className="badge-warning mx-auto">Verify your email</span>
              <h1 className="mt-3 text-2xl font-extrabold text-[var(--brand-text)]">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                Click the link to verify your account.
              </p>

              <div className="mt-6 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
                <p className="text-sm leading-6 text-[var(--brand-text)]">
                  Didn&apos;t receive the email? Check your spam folder, or request a new link.
                </p>
              </div>

              <ErrorMessage message={error} />

              <button
                type="button"
                onClick={resendVerification}
                disabled={loading}
                className="btn-secondary mt-4 w-full disabled:cursor-wait"
              >
                {loading ? "Sending..." : "Resend verification email"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/verify-email")}
                className="btn-primary mt-3 w-full"
              >
                I&apos;ve confirmed my email
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                className="mt-4 block w-full text-center text-sm font-bold text-[var(--brand-primary)] hover:underline"
              >
                Try a different account
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
              <span className="badge-info mx-auto">Renter sign up</span>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                Create your renter account
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                Start finding your perfect rental
              </p>
            </div>

            <ErrorMessage message={error} />

            <form onSubmit={handleSignup} className="space-y-4 mt-6">
              <div>
                <label htmlFor="fullName" className="label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Contact Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email
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
                  disabled={loading}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

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
                href="/login/renter"
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