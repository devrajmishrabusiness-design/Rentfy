"use client";

import { supabase } from "@/lib/supabase";

export default function ContactAgencyButton({
  propertyId,
  agencyId,
  whatsappUrl,
}: {
  propertyId: string;
  agencyId: string;
  whatsappUrl: string;
}) {
  const handleClick = async () => {
    await supabase.from("leads").insert({
      property_id: propertyId,
      agency_id: agencyId,
      source: "whatsapp",
    });

    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg"
    >
      WhatsApp Agency
    </button>
  );
}