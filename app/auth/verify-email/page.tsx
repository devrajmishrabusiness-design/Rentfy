"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResendEmailSent({ email, onResend, loading }: { email: string; onResend: () => void; loading: boolean }) {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
              <CheckIcon />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[var(--brand-text)]">Email sent!</h1>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              We&apos;ve resent the verification link to <strong>{email}</strong>. Check your inbox.
            </p>
            <button type="button" onClick={onResend} disabled={loading} className="btn-secondary mt-4 w-full disabled:cursor-wait">
              {loading ? "Sending..." : "Resend verification email"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function VerificationFailed({ error, email, emailRequired, onResend, loading, onCheckVerification, isCheckingVerification, checkMessage }: {
  error: string | null;
  email: string;
  emailRequired: boolean;
  onResend: () => void;
  loading: boolean;
  onCheckVerification: () => void;
  isCheckingVerification: boolean;
  checkMessage: string | null;
}) {
  return (
    <main className="min-h-screen bg-[var(--brand-background)]">
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100">
              <CrossIcon />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-[var(--brand-text)]">Verification pending</h1>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              {error || "We're waiting for you to confirm your email."}
            </p>
            {checkMessage && (
              <div className="mt-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
                <p className="text-sm leading-6 text-[var(--brand-text)]">{checkMessage}</p>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-6">
                <p className="text-sm leading-6 text-[var(--brand-text)]">
                  We sent a confirmation link to{" "}
                  <strong>{email || "your email"}</strong> when you signed up.
                  Click that link first, then check your verification status below.
                </p>
              </div>
              <button type="button" onClick={onCheckVerification} disabled={isCheckingVerification} className="btn-primary w-full disabled:cursor-wait">
                {isCheckingVerification ? "Checking..." : "I've Clicked the Verification Link"}
              </button>
              <button type="button" onClick={onResend} disabled={loading || emailRequired} className="btn-secondary w-full disabled:cursor-wait">
                {loading ? "Sending..." : "Resend verification email"}
              </button>
              <Link href="/" className="block w-full text-center text-sm font-bold text-[var(--brand-primary)] hover:underline">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function Spinner() {
  return <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--brand-border)] border-t-[var(--brand-primary)] mx-auto" />;
}

async function resolvePostVerificationDestination(userId: string): Promise<string> {
  const { data: agencyRow } = await supabase
    .from("agency_profiles")
    .select("id, verified")
    .eq("auth_user_id", userId)
    .maybeSingle<{ id: string; verified: boolean }>();

  if (agencyRow) {
    return agencyRow.verified ? "/dashboard" : "/onboarding/agency";
  }

  const { data: renterRow } = await supabase
    .from("renter_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  if (renterRow) {
    return "/renter";
  }

  return "/";
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResendSent, setShowResendSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const next = searchParams.get("next");

    if (code && type === "signup") {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          setIsChecking(false);
          return;
        }
        const user = data?.user || data?.session?.user;
        if (user && !user.email_confirmed_at) {
          setError("Email not confirmed. Please check your inbox.");
          setIsChecking(false);
          return;
        }
        if (user) {
          setIsVerified(true);
          const destination = next || await resolvePostVerificationDestination(user.id);
          router.push(destination);
          setShowSuccess(true);
        }
      });
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user && user.email_confirmed_at) {
        setIsVerified(true);
        const destination = next || await resolvePostVerificationDestination(user.id);
        router.push(destination);
        setShowSuccess(true);
        return;
      }
      setIsChecking(false);
      setEmail(user?.email || "");
    });
  }, [router, searchParams]);

  const handleResend = () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/verify-email` },
    }).then(({ error: resendError }) => {
      setLoading(false);
      if (resendError) {
        setError(resendError.message);
      } else {
        setShowResendSent(true);
        setTimeout(() => setShowResendSent(false), 3000);
      }
    });
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setCheckMessage(null);
    setError(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (user?.email_confirmed_at) {
      setIsVerified(true);
      setCheckMessage("Email verified successfully!");
      const destination = next || await resolvePostVerificationDestination(user.id);
      router.push(destination);
      setShowSuccess(true);
    } else {
      setCheckMessage("We couldn't verify your email yet. Please make sure you clicked the link in your inbox.");
      setIsCheckingVerification(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <Spinner />
              <h1 className="mt-4 text-xl font-bold text-[var(--brand-text)]">Verifying your email...</h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">Please wait while we confirm your account.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (isVerified || showSuccess) {
    return (
      <main className="min-h-screen bg-[var(--brand-background)]">
        <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
                <CheckIcon />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold text-[var(--brand-text)]">Email verified!</h1>
              <p className="mt-2 text-sm text-[var(--brand-muted)]">
                {checkMessage || "Welcome to RenterEasy. Redirecting..."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/" className="btn-secondary">Go Home</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (showResendSent) {
    return <ResendEmailSent email={email} onResend={handleResend} loading={loading} />;
  }

  return (
    <VerificationFailed
      error={error}
      email={email}
      emailRequired={!email}
      onResend={handleResend}
      loading={loading}
      onCheckVerification={handleCheckVerification}
      isCheckingVerification={isCheckingVerification}
      checkMessage={checkMessage}
    />
  );
}