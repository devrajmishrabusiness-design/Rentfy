"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyAgency } from "@/app/admin/actions";

export default function VerifyAgencyButton({
  agencyId,
}: {
  agencyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleVerify = () => {
    setError(null);
    startTransition(async () => {
      const result = await verifyAgency(agencyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleVerify}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-success)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Verifying…" : "Verify"}
      </button>
      {error && (
        <p className="text-xs font-medium text-[var(--brand-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
