"use client";

import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "Delete this property?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      alert("Property deleted!");
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Delete
    </button>
  );
}