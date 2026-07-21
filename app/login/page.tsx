"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Footer from "../Footer";
import ErrorMessage from "../ErrorMessage";

function safeRedirect(redirect: string | null): string | null {
  if (!redirect || typeof redirect !== "string") return null;
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return null;
}

async function resolvePostLoginDestination(
  explicitRedirect: string | null
): Promise<string> {
  if (explicitRedirect) return explicitRedirect;

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle<{ id: string }>();

  return agency ? "/dashboard" : "/onboarding/agency";
}

type LoginState = "form" | "unverified";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>("form");
  const [sessionExpired] = useState(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("rentfy.sessionExpired") === "1") {
      sessionStorage.removeItem("rentfy.sessionExpired");
      return true;
    }
    return false;
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const user = data.session.user;
        if (!user.email_confirmed_at) {
          router.push("/verify-email");
          return;
        }
        const dest = await resolvePostLoginDestination(
          safeRedirect(searchParams.get("redirect"))
        );
        router.push(dest);
      }
    });
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      setLoginState("unverified");
      return;
    }

    const dest = await resolvePostLoginDestination(
      safeRedirect(searchParams.get("redirect"))
    );
    router.push(dest);
  };

  const resendVerification = async () => {
    setError(null);
    setLoading(true);
const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    if (resendError) {
      setError(resendError.message);
    }
  };

  if (loginState === "unverified") {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card p-8">
              <div className="mb-6 text-center">
                <span className="badge-warning mx-auto">Email not verified</span>
                <h1 className="mt-3 text-2xl font-extrabold text-[var(--brand-text)]">
                  Verify your email first
                </h1>
                <p className="mt-2 text-sm text-[var(--brand-muted)]">
                  Your account was created but your email has not been confirmed.
                  Check your inbox for the verification link.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
                <p className="text-sm leading-6 text-[var(--brand-text)]">
                  We sent a confirmation link to <strong>{email}</strong> when
                  you signed up. Click that link first, then sign in again.
                </p>
              </div>

              <ErrorMessage message={error} className="mt-4" />

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
                onClick={() => { setLoginState("form"); setError(null); }}
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
              <span className="badge-info mx-auto">Agency access</span>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                Welcome back to RenterEasy
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                Manage your listings, profile and rental leads.
              </p>
              {sessionExpired && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Your session expired. Please sign in again to continue.
                </div>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Agency email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
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
                />
              </div>

              <ErrorMessage message={error} />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:cursor-wait"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--brand-muted)]">
              New agency?{" "}
              <Link
                href="/signup"
                className="font-bold text-[var(--brand-primary)] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}