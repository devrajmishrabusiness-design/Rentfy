"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../Navbar";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    agency_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("User creation failed");
      return;
    }

    const { error: agencyError } = await supabase
      .from("agencies")
      .insert([
        {
          agency_name: form.agency_name,
          owner_name: form.owner_name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          auth_user_id: user.id,
        },
      ]);

    if (agencyError) {
      alert(agencyError.message);
      return;
    }

    alert("Agency created successfully!");
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-emerald-700">
            Join Rentfy
          </p>
          <h1 className="mt-3 text-center text-3xl font-bold">
            Create an agency account
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Publish verified rental listings and manage tenant enquiries.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Agency Name"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, agency_name: e.target.value })
              }
            />

            <input
              placeholder="Owner Name"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, owner_name: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <input
              placeholder="Phone"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <input
              placeholder="City"
              className="w-full rounded border border-slate-300 p-3 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
            />
          </div>

          <button
            onClick={handleSignup}
            className="mt-5 w-full rounded bg-slate-950 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Create Agency Account
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-950 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
