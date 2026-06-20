"use client";

import { supabase } from "@/lib/supabase";

export default function VerifyAgencyButton({
  agencyId,
}: {
  agencyId: string;
}) {
  const verifyAgency = async () => {
    await supabase
      .from("agencies")
      .update({ verified: true })
      .eq("id", agencyId);

    window.location.reload();
  };

  return (
    <button
      onClick={verifyAgency}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Verify Agency
    </button>
  );
}