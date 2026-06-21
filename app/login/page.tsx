"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("LOGIN SUCCESS");
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-emerald-700">
            Agency access
          </p>
          <h1 className="mt-3 text-center text-3xl font-bold">
            Login to Rentfy
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Manage your listings, profile, and rental leads.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Agency Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            onClick={handleLogin}
            className="mt-5 w-full rounded bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Login
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            New agency?{" "}
            <Link
              href="/signup"
              className="font-semibold text-slate-950 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
