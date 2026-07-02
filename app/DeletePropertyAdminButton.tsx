"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePropertyAdmin } from "@/app/admin/actions";

export default function DeletePropertyAdminButton({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    const ok = confirm(
      propertyTitle
        ? `Delete "${propertyTitle}"? This cannot be undone.`
        : "Delete this property? This cannot be undone.",
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const result = await deletePropertyAdmin(propertyId);
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
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p className="text-[11px] font-medium text-[var(--brand-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
