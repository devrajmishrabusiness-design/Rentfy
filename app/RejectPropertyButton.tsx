"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RejectPropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();

  const rejectProperty = async () => {
    const { error } = await supabase
      .from("properties")
      .update({ status: "rejected" })
      .eq("id", propertyId);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={rejectProperty}
      className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-200"
    >
      Reject
    </button>
  );
}