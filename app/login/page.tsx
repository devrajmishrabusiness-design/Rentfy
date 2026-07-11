"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Footer from "../Footer";
import ErrorMessage from "../ErrorMessage";

function safeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== "string") return "/dashboard";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/dashboard";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push(redirectTo);
      }
    });
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectTo);
  };

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