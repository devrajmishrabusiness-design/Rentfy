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
      .update({
        status: "rejected",
      })
      .eq("id", propertyId);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <button
      onClick={rejectProperty}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Reject
    </button>
  );
}