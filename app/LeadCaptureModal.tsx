"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import ErrorMessage from "./ErrorMessage";

type LeadCaptureModalProps = {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  agencyId: string;
  source: "whatsapp" | "contact";
  onSuccess: (data: { name: string; phone: string }) => void;
  propertyTitle?: string;
  agencyName?: string;
  /**
   * When provided, the lead is written with this `renter_id` (logged-in
   * renter flow). The form is shown in this case only as a fallback —
   * see `renterSkipForm` for the path that skips the form entirely.
   */
  renterId?: string | null;
  /**
   * When true AND `renterProfile` is provided, the form is skipped and
   * the modal just writes the lead silently and calls `onSuccess` with
   * the renter's name + verified phone. Used when the renter is
   * already onboarded (has full_name).
   */
  renterSkipForm?: boolean;
  renterProfile?: { full_name: string | null; phone_number: string } | null;
};

const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

function RenterLeadCapture({
  propertyId,
  agencyId,
  source,
  onSuccess,
  renterId,
  renterProfile,
}: LeadCaptureModalProps) {
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current || !renterId || !renterProfile?.full_name) return;
    started.current = true;
    const fullName = renterProfile.full_name;

    void (async () => {
      const { error: insertError } = await supabase.from("leads").insert({
        property_id: propertyId,
        agency_id: agencyId,
        name: fullName,
        phone: renterProfile.phone_number,
        status: "New",
        source,
        renter_id: renterId,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }
      onSuccess({ name: fullName, phone: renterProfile.phone_number });
    })();
  }, [agencyId, onSuccess, propertyId, renterId, renterProfile, source]);

  return (
    <div className="px-6 py-8 text-center">
      <p id="lead-modal-title" className="font-semibold text-[var(--brand-text)]">
        {error ? "We couldn't save your enquiry." : "Connecting you with the agency..."}
      </p>
      <ErrorMessage message={error} />
    </div>
  );
}

function LeadCaptureForm({
  propertyId,
  agencyId,
  source,
  onSuccess,
  propertyTitle,
  agencyName,
  renterId,
}: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Full name is required.";
    else if (name.trim().length < 2)
      next.name = "Please enter your full name.";

    if (!phone.trim()) next.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(phone.trim()))
      next.phone = "Please enter a valid phone number.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    try {
      const { error } = await supabase.from("leads").insert({
        property_id: propertyId,
        agency_id: agencyId,
        name: cleanName,
        phone: cleanPhone,
        status: "New",
        source,
        created_at: new Date().toISOString(),
        ...(renterId ? { renter_id: renterId } : {}),
      });

      if (error) {
        setServerError(error.message);
        setSubmitting(false);
        return;
      }

      onSuccess({ name: cleanName, phone: cleanPhone });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setServerError(msg);
      setSubmitting(false);
    }
  };

  const sourceLabel =
    source === "whatsapp" ? "continue on WhatsApp" : "reveal the contact number";

  return (
    <>
      <div className="relative bg-slate-900 px-6 py-7 text-white">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
            {source === "whatsapp" ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20.52 3.48A11.94 11.94 0 0012.06 0C5.5 0 .12 5.37.12 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.92 11.92 0 005.79 1.48h.01c6.55 0 11.94-5.38 11.94-11.95 0-3.19-1.24-6.19-3.49-8.41zM12.07 21.7h-.01a9.85 9.85 0 01-5.02-1.38l-.36-.21-3.72.98 1-3.63-.24-.37a9.84 9.84 0 01-1.51-5.16c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 012.89 7c0 5.45-4.43 9.76-9.92 9.76z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
              </svg>
            )}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              One quick step
            </p>
            <h2
              id="lead-modal-title"
              className="text-xl font-extrabold leading-tight"
            >
              {source === "whatsapp"
                ? "Connect on WhatsApp"
                : "Get contact details"}
            </h2>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-white/90">
          Share your details so the agency can reach you about
          {propertyTitle ? (
            <span className="font-semibold"> {propertyTitle}</span>
          ) : " this property"}
          {agencyName ? (
            <>
              {" "}from <span className="font-semibold">{agencyName}</span>
            </>
          ) : null}
          . We&apos;ll {sourceLabel} right after.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="lead-name" className="label">
              Full name
            </label>
            <input
              id="lead-name"
              type="text"
              className="input"
              placeholder="e.g. Aman Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-[var(--brand-error)]">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lead-phone" className="label">
              Phone number
            </label>
            <input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              className="input"
              placeholder="e.g. 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-medium text-[var(--brand-error)]">
                {errors.phone}
              </p>
            )}
          </div>

          <ErrorMessage message={serverError} />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:cursor-wait"
          >
            {submitting
              ? "Saving..."
              : source === "whatsapp"
              ? "Save & open WhatsApp"
              : "Save & reveal number"}
          </button>

          <p className="text-center text-xs leading-5 text-[var(--brand-muted)]">
            Your details are shared only with the verified agency listing
            this property.
          </p>
        </div>
      </form>
    </>
  );
}

export default function LeadCaptureModal(props: LeadCaptureModalProps) {
  const { open, onClose } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {props.renterSkipForm && props.renterProfile?.full_name ? (
          <RenterLeadCapture key={`${props.source}-${props.propertyId}`} {...props} />
        ) : (
          <LeadCaptureForm key={`${props.source}-${props.propertyId}`} {...props} />
        )}
      </div>
    </div>
  );
}
