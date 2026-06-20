"use client";

import { supabase } from "@/lib/supabase-browser";

export default function DeletePropertyAdminButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const deleteProperty = async () => {
    const confirmed = confirm(
      "Delete this property?"
    );

    if (!confirmed) return;


    await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    window.location.reload();
  };

  return (
    <button
      onClick={deleteProperty}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Delete Property
    </button>
  );
}