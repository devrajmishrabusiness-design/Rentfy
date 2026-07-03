"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { AgencyReview } from "../types";
import ErrorMessage from "../ErrorMessage";
import { useRenterSession } from "./useRenterSession";

export default function AgencyReviews({ agencyId }: { agencyId: string }) {
  const { profile, openAuthDialog } = useRenterSession();
  const [reviews, setReviews] = useState<AgencyReview[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadReviews = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("agency_reviews")
      .select("*")
      .eq("agency_id", agencyId)
      .order("updated_at", { ascending: false })
      .returns<AgencyReview[]>();

    if (queryError) {
      setError(
        queryError.message.includes("schema cache")
          ? "Agency ratings are being set up. Please try again shortly."
          : queryError.message
      );
    } else {
      setReviews(data ?? []);
      const own = data?.find((review) => review.renter_id === profile?.id);
      if (own) {
        setRating(own.rating);
        setComment(own.comment ?? "");
      }
    }
    setLoading(false);
  }, [agencyId, profile?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const average = useMemo(
    () => reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0,
    [reviews]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!profile) {
      await openAuthDialog("general");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    setSubmitting(true);
    const cleanComment = comment.trim();
    const { error: saveError } = await supabase
      .from("agency_reviews")
      .upsert(
        {
          renter_id: profile.id,
          agency_id: agencyId,
          reviewer_name: profile.full_name || "Verified renter",
          rating,
          comment: cleanComment || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "renter_id,agency_id" }
      );
    setSubmitting(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSaved(true);
    await loadReviews();
  };

  return (
    <div className="mt-6 border-t border-[var(--brand-border)] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-[var(--brand-text)]">Renter ratings</h3>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Based on renters&apos; experience with this agency.</p>
        </div>
        <div className="rounded-2xl bg-orange-50 px-4 py-2 text-right">
          <p className="text-xl font-extrabold text-[var(--brand-text)]">{reviews.length ? average.toFixed(1) : "—"}<span className="text-sm text-amber-500"> ★</span></p>
          <p className="text-[11px] font-semibold text-[var(--brand-muted)]">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 rounded-2xl bg-[var(--brand-background)] p-4">
        <p className="text-sm font-bold text-[var(--brand-text)]">
          {profile && reviews.some((review) => review.renter_id === profile.id) ? "Update your rating" : "Rate this agency"}
        </p>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Agency rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              onClick={() => profile ? setRating(star) : void openAuthDialog("general")}
              className={`text-3xl leading-none transition hover:scale-110 ${star <= rating ? "text-amber-400" : "text-stone-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <label htmlFor={`agency-review-${agencyId}`} className="mt-4 block text-xs font-bold text-[var(--brand-text)]">Review <span className="font-normal text-[var(--brand-muted)]">(optional)</span></label>
        <textarea
          id={`agency-review-${agencyId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={!profile}
          maxLength={600}
          rows={3}
          className="textarea mt-1 min-h-20 disabled:bg-stone-100"
          placeholder={profile ? "Share what went well or what could improve..." : "Sign in as a renter to leave a review"}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--brand-muted)]">{comment.length}/600</span>
          <button type="submit" disabled={submitting} className="btn-primary px-4 py-2">
            {submitting ? "Saving..." : profile ? "Save review" : "Sign in to rate"}
          </button>
        </div>
        <ErrorMessage message={error} className="mt-3" />
        {saved && <p className="mt-3 text-sm font-semibold text-emerald-700">Thanks—your review is now live.</p>}
      </form>

      {!loading && reviews.some((review) => review.comment) && (
        <div className="mt-5 space-y-3">
          {reviews.filter((review) => review.comment).slice(0, 5).map((review) => (
            <article key={review.id} className="rounded-2xl border border-[var(--brand-border)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[var(--brand-text)]">{review.reviewer_name}</p>
                <p className="text-sm font-bold text-amber-500">{review.rating.toFixed(1)} ★</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
