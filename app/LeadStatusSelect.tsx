"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/app/actions";

export default function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (status: string) => {
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, status);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <select
      defaultValue={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--brand-text)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
    >
      <option value="New">New</option>
      <option value="Contacted">Contacted</option>
      <option value="Closed">Closed</option>
    </select>
  );
}