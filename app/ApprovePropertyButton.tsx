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
      .update({
        status: "approved",
      })
      .eq("id", propertyId);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <button
      onClick={approveProperty}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Approve
    </button>
  );
}