"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveProperty } from "@/app/admin/actions";

export default function ApprovePropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveProperty(propertyId);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={isPending}
      className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
    >
      {isPending ? "Approving..." : "Approve"}
    </button>
  );
}