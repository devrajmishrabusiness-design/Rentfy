"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { rejectProperty } from "@/app/admin/actions";

export default function RejectPropertyButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectProperty(propertyId);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleReject}
      disabled={isPending}
      className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-200 disabled:opacity-50"
    >
      {isPending ? "Rejecting..." : "Reject"}
    </button>
  );
}