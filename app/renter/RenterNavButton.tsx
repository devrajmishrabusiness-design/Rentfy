"use client";

import { supabase } from "@/lib/supabase-browser";
import { useRenterSession } from "./useRenterSession";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RenterNavButton() {
  const { profile, openAuthDialog, isLoading } = useRenterSession();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoading) {
    return <span className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!profile) {
    return (
      <button
        type="button"
        onClick={() => void openAuthDialog("general")}
        className="btn-primary py-2"
      >
        Renter sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/renter" className="max-w-32 truncate rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-orange-100">
        <span className="sm:hidden">Profile</span>
        <span className="hidden sm:inline">Hi, {profile.full_name?.split(" ")[0] || "Renter"}</span>
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-xl border border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-muted)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
      >
        Sign out
      </button>
    </div>
  );
}
