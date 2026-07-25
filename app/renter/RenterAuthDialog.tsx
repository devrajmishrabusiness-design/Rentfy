"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase-browser";
import ErrorMessage from "../ErrorMessage";
import { useRenterSession } from "./useRenterSession";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

function getProfileError(message: string) {
  if (message.includes("renter_profiles") && message.includes("schema cache")) {
    return "Renter accounts are being set up. Please try again shortly.";
  }
  return message;
}

export default function RenterAuthDialog() {
  const { isAuthOpen, closeAuthDialog, refreshProfile } = useRenterSession();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setMode("signin");
    setFullName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setError(null);
    setNotice(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    closeAuthDialog();
  }, [closeAuthDialog, reset]);

  useEffect(() => {
    if (!isAuthOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, isAuthOpen]);

  if (!isAuthOpen) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (mode === "signup" && cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (mode === "signup" && !/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)) {
      setError("Please enter a valid contact number for agency callbacks.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            role: "renter",
            full_name: cleanName,
            phone_number: cleanPhone,
          },
        },
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      if (!data.session || !data.user) {
        setLoading(false);
        setNotice("Check your email to confirm your account, then return here to sign in.");
        setMode("signin");
        setPassword("");
        return;
      }

      // Guard: if Supabase auto-confirmed the session (e.g. dev mode with
      // CONFIRM_EMAIL disabled) but the email is not actually verified,
      // block profile creation until the user verifies through the
      // sign-in path, which checks email_confirmed_at before proceeding.
      if (!data.user.email_confirmed_at) {
        setLoading(false);
        setNotice("Check your email to confirm your account, then return here to sign in.");
        setMode("signin");
        setPassword("");
        // Remove the auto-created session so the user cannot bypass
        // verification by refreshing the page.
        await supabase.auth.signOut();
        return;
      }

      const { error: profileError } = await supabase.from("renter_profiles").insert({
        user_id: data.user.id,
        full_name: cleanName,
        phone_number: cleanPhone,
      });

      if (profileError) {
        setLoading(false);
        setError(getProfileError(profileError.message));
        return;
      }

      await refreshProfile(data.user.id);
      router.refresh();
      handleClose();
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message ?? "Could not sign in.");
      return;
    }

    if (!data.user.email_confirmed_at) {
      setLoading(false);
      setNotice("Your email is not verified yet. Please check your inbox for the confirmation link.");
      return;
    }

    const { data: existingProfile } = await supabase
      .from("renter_profiles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle<{ id: string }>();

    if (!existingProfile) {
      // Capability-based: a verified authenticated user with no renter
      // profile can create one regardless of user_metadata. Role is
      // derived from profile existence, not from metadata flags.
      const metadata = data.user.user_metadata;
      const fullName =
        typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
          ? metadata.full_name.trim()
          : null;
      const phone =
        typeof metadata?.phone_number === "string" && metadata.phone_number.trim().length > 0
          ? metadata.phone_number.trim()
          : "";

      const { error: profileError } = await supabase.from("renter_profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        phone_number: phone,
      });
      if (profileError) {
        setLoading(false);
        setError(getProfileError(profileError.message));
        return;
      }
    }

    await refreshProfile(data.user.id);
    router.refresh();
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="renter-auth-title"
      onClick={handleClose}
    >
      <div
        className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close renter sign in"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <span aria-hidden>×</span>
        </button>

        <aside className="hidden bg-slate-950 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
              For renters
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight">
              Your rental search, kept in one place.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create a free account to move faster when you find the right home.
            </p>
          </div>
          <ul className="mt-8 space-y-4 text-sm text-slate-200">
            <li className="flex gap-3"><span className="text-orange-400">✓</span> Save promising properties</li>
            <li className="flex gap-3"><span className="text-orange-400">✓</span> Contact verified agencies quickly</li>
            <li className="flex gap-3"><span className="text-orange-400">✓</span> Reuse your enquiry details</li>
          </ul>
        </aside>

        <section className="p-6 sm:p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            Renter account
          </p>
          <h2 id="renter-auth-title" className="mt-2 text-2xl font-extrabold text-[var(--brand-text)]">
            {mode === "signin" ? "Welcome back" : "Find your next home"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            {mode === "signin"
              ? "Sign in to continue saving properties and contacting agencies."
              : "Free to use. Your details are shared only when you contact an agency."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setMode(item); setError(null); setNotice(null); }}
                className={`rounded-lg px-3 py-2 transition ${mode === item ? "bg-white text-[var(--brand-text)] shadow-sm" : "text-[var(--brand-muted)]"}`}
              >
                {item === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="renter-name" className="label">Full name</label>
                  <input id="renter-name" className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aman Verma" required />
                </div>
                <div>
                  <label htmlFor="renter-phone" className="label">Contact number</label>
                  <input id="renter-phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" required />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="renter-email" className="label">Email address</label>
              <input id="renter-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <label htmlFor="renter-password" className="label">Password</label>
              <input id="renter-password" className="input" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
            </div>

            <ErrorMessage message={error} />
            {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-wait">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in as renter" : "Create free account"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs leading-5 text-[var(--brand-muted)]">
            Are you an agency? <a href="/login/agency" className="font-bold text-[var(--brand-primary)] hover:underline">Use agency login</a>
          </p>
        </section>
      </div>
    </div>
  );
}
