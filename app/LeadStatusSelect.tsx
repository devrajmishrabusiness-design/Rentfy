"use client";

import { supabase } from "@/lib/supabase";

export default function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const updateStatus = async (status: string) => {
    await supabase.from("leads").update({ status }).eq("id", leadId);
    window.location.reload();
  };

  return (
    <select
      defaultValue={currentStatus}
      onChange={(e) => updateStatus(e.target.value)}
      className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100"
    >
      <option value="New">New</option>
      <option value="Contacted">Contacted</option>
      <option value="Closed">Closed</option>
    </select>
  );
}