"use client";

import { useState } from "react";
import LeadCaptureModal from "./LeadCaptureModal";

export default function ContactAgencyButton({
  propertyId,
  agencyId,
  whatsappPhone,
  contactPhone,
  propertyTitle,
  agencyName,
}: {
  propertyId: string;
  agencyId: string;
  whatsappPhone: string;
  contactPhone: string;
  propertyTitle?: string;
  agencyName?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState<"whatsapp" | "contact">("whatsapp");
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  const open = (src: "whatsapp" | "contact") => {
    setSource(src);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    if (source === "whatsapp") {
      const message = `Hi, I am interested in ${
        propertyTitle || "a property"
      } listed on RenterEasy.`;
      const url = `https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(
        message
      )}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setRevealedPhone(contactPhone);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => open("whatsapp")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-green-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-md active:scale-[0.99]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M20.52 3.48A11.94 11.94 0 0012.06 0C5.5 0 .12 5.37.12 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.92 11.92 0 005.79 1.48h.01c6.55 0 11.94-5.38 11.94-11.95 0-3.19-1.24-6.19-3.49-8.41zM12.07 21.7h-.01a9.85 9.85 0 01-5.02-1.38l-.36-.21-3.72.98 1-3.63-.24-.37a9.84 9.84 0 01-1.51-5.16c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 012.89 7c0 5.45-4.43 9.76-9.92 9.76z" />
        </svg>
        WhatsApp Agency
      </button>

      <button
        type="button"
        onClick={() => open("contact")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--brand-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--brand-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] active:scale-[0.99]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
        </svg>
        Contact Agency
      </button>

      {revealedPhone && (
        <a
          href={`tel:${revealedPhone}`}
          className="block rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 animate-fade-in-up"
        >
          📞 {revealedPhone}
        </a>
      )}

      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        propertyId={propertyId}
        agencyId={agencyId}
        source={source}
        onSuccess={handleSuccess}
        propertyTitle={propertyTitle}
        agencyName={agencyName}
      />
    </div>
  );
}
