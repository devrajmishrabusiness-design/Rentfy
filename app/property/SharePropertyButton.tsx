"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function SharePropertyButton({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/property/${propertyId}`
    : "";

  const recordShare = useCallback(async (platform: "copy" | "whatsapp") => {
    try {
      const { error: insertError } = await supabase
        .from("shared_properties")
        .insert({
          property_id: propertyId,
          share_platform: platform,
        });

      if (insertError) {
        console.error("Failed to record share:", insertError);
      }
    } catch {
      console.error("Failed to record share");
    }
  }, [propertyId]);

  const handleShare = async () => {
    setError(null);

    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle || "Property on RenterEasy",
          url: shareUrl,
        });
        await recordShare("whatsapp");
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await recordShare("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
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
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        {copied ? "Copied!" : "Share Property"}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}