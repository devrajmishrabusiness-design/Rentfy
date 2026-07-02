"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Link from "next/link";
import Footer from "../Footer";
import ApplicationSubmitted from "../ApplicationSubmitted";

export default function SignupPage() {
  const [form, setForm] = useState({
    agency_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { error: agencyError } = await supabase.from("agencies").insert([
      {
        agency_name: form.agency_name,
        owner_name: form.owner_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        auth_user_id: user.id,
        verified: false,
      },
    ]);

    setLoading(false);

    if (agencyError) {
      setError(agencyError.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return <ApplicationSubmitted />;
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="card p-8">
            <div className="mb-6 text-center">
              <span className="badge-info mx-auto">Join RenterEasy</span>
              <h1 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)]">
                Create your agency account
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                Publish verified rental listings and manage tenant enquiries
                in one place.
              </p>
            </div>

            <form onSubmit={handleSignup} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="agency_name" className="label">
                  Agency name
                </label>
                <input
                  id="agency_name"
                  required
                  placeholder="e.g. Noida Realty Hub"
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, agency_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label htmlFor="owner_name" className="label">
                  Owner name
                </label>
                <input
                  id="owner_name"
                  required
                  placeholder="e.g. Aman Verma"
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, owner_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone
                </label>
                <input
                  id="phone"
                  required
                  placeholder="98765 43210"
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
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
                  placeholder="you@agency.com"
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
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
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="city" className="label">
                  City
                </label>
                <input
                  id="city"
                  required
                  placeholder="e.g. Noida"
                  className="input"
                  onChange={(e) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
              </div>

              {error && (
                <div className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary sm:col-span-2 disabled:cursor-wait"
              >
                {loading ? "Submitting application..." : "Create agency account"}
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