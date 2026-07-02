"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unverifyAgency } from "@/app/admin/actions";

export default function UnverifyAgencyButton({
  agencyId,
}: {
  agencyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUnverify = () => {
    setError(null);
    startTransition(async () => {
      const result = await unverifyAgency(agencyId);
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
        onClick={handleUnverify}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Revoking…" : "Revoke"}
      </button>
      {error && (
        <p className="text-xs font-medium text-[var(--brand-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
