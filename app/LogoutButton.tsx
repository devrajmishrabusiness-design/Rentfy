"use client";

import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
    >
      Logout
    </button>
  );
}