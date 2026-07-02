"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ApprovePropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();

  const approveProperty = async () => {
    const { error } = await supabase
      .from("properties")
      .update({ status: "approved" })
      .eq("id", propertyId);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={approveProperty}
      className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
    >
      Approve
    </button>
  );
}