"use client";

import { useState } from "react";
import { useRenterSession } from "./useRenterSession";
import { setPendingAction } from "./pendingAction";

interface ScheduleVisitButtonProps {
  propertyId: string;
  agencyId: string;
  propertyTitle?: string;
}

export default function ScheduleVisitButton({
  propertyId,
  agencyId,
  propertyTitle,
}: ScheduleVisitButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { profile, openAuthDialog } = useRenterSession();

  const openModal = () => {
    if (!profile) {
      setPendingAction({ kind: "visit", propertyId, agencyId });
      void openAuthDialog("general");
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--brand-primary)] bg-white px-5 py-3 text-sm font-bold text-[var(--brand-primary)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md active:scale-[0.99]"
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
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
        Schedule a Visit
      </button>

      {modalOpen && (
        <ScheduleVisitModal
          propertyId={propertyId}
          agencyId={agencyId}
          propertyTitle={propertyTitle}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function ScheduleVisitModal({
  propertyId,
  propertyTitle,
  onClose,
}: {
  propertyId: string;
  agencyId: string;
  propertyTitle?: string;
  onClose: () => void;
}) {
  const { profile } = useRenterSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitType, setVisitType] = useState<"site_visit" | "video_tour">("site_visit");
  const [notes, setNotes] = useState("");

  // Compute static dates during render - avoids useEffect setState warning
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          renter_id: profile?.id,
          visit_date: visitDate,
          visit_time: visitTime,
          visit_type: visitType,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule visit");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="visit-success-title" onClick={onClose}>
        <div className="card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">
              ✓
            </div>
            <h2 id="visit-success-title" className="text-2xl font-bold text-[var(--brand-text)]">Visit Requested!</h2>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              The agency will confirm your visit request shortly. You&apos;ll receive a notification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-modal-title"
      onClick={onClose}
    >
      <div className="card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="visit-modal-title" className="text-xl font-bold text-[var(--brand-text)]">Schedule a Visit</h2>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-stone-100 transition"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <p className="mb-6 text-sm text-[var(--brand-muted)]">
            Request a site visit for <span className="font-semibold text-[var(--brand-text)]">{propertyTitle || "this property"}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Preferred Date</label>
              <input
                type="date"
                required
                min={today}
                max={maxDate}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Preferred Time</label>
              <select
                required
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="select"
              >
                <option value="">Select a time slot</option>
                <option value="morning">Morning (9 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                <option value="evening">Evening (6 PM - 8 PM)</option>
              </select>
            </div>

            <div>
              <label className="label">Visit Type</label>
              <div className="flex gap-3">
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${visitType === "site_visit" ? "border-[var(--brand-primary)] bg-orange-50 text-[var(--brand-primary)]" : "border-[var(--brand-border)] text-[var(--brand-muted)]"}`}>
                  <input
                    type="radio"
                    name="visitType"
                    value="site_visit"
                    checked={visitType === "site_visit"}
                    onChange={() => setVisitType("site_visit")}
                    className="sr-only"
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Physical
                </label>
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${visitType === "video_tour" ? "border-[var(--brand-primary)] bg-orange-50 text-[var(--brand-primary)]" : "border-[var(--brand-border)] text-[var(--brand-muted)]"}`}>
                  <input
                    type="radio"
                    name="visitType"
                    value="video_tour"
                    checked={visitType === "video_tour"}
                    onChange={() => setVisitType("video_tour")}
                    className="sr-only"
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Video Call
                </label>
              </div>
            </div>

            <div>
              <label className="label">Additional Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements or questions..."
                className="textarea"
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Request Visit"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}