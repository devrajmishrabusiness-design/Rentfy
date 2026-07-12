"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnProperty } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    const confirmDelete = confirm("Delete this property?");
    if (!confirmDelete) return;

    startTransition(async () => {
      const result = await deleteOwnProperty(id);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={isPending}
        className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error && (
        <p className="mt-1 text-[10px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}