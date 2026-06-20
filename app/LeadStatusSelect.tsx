"use client";

import { supabase } from "@/lib/supabase";

export default function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const updateStatus = async (
    status: string
  ) => {
    await supabase
      .from("leads")
      .update({ status })
      .eq("id", leadId);

    window.location.reload();
  };

  return (
    <select
      defaultValue={currentStatus}
      onChange={(e) =>
        updateStatus(e.target.value)
      }
      className="border rounded px-2 py-1"
    >
      <option value="new">New</option>
      <option value="contacted">
        Contacted
      </option>
      <option value="closed">Closed</option>
    </select>
  );
}