"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";

const SWIPE_THRESHOLD = 50;

export default function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages = useMemo(() => images?.filter(Boolean) ?? [], [images]);
  const [selectedImage, setSelectedImage] = useState(() => safeImages[0] || "");
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const currentIndex = safeImages.indexOf(selectedImage);

  const nextImage = useCallback(() => {
    setSelectedImage(safeImages[(currentIndex + 1) % safeImages.length]);
  }, [safeImages, currentIndex]);

  const prevImage = useCallback(() => {
    setSelectedImage(
      safeImages[(currentIndex - 1 + safeImages.length) % safeImages.length]
    );
  }, [safeImages, currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImage();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen, nextImage, prevImage]);

  if (safeImages.length === 0) {
    return (
      <div className="mb-10 grid h-72 w-full place-items-center rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50 text-sm font-medium text-[var(--brand-muted)]">
        No photos available
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div
        className="relative overflow-hidden rounded-3xl bg-stone-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={selectedImage}
          alt={title}
          width={1600}
          height={900}
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onClick={() => setFullscreen(true)}
          className="h-[420px] w-full cursor-pointer object-cover transition-transform duration-500 hover:scale-[1.01] sm:h-[480px]"
        />

        <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          {currentIndex + 1} / {safeImages.length}
        </div>

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-xl text-black shadow-md backdrop-blur transition hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-xl text-black shadow-md backdrop-blur transition hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {safeImages.map((image) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`relative overflow-hidden rounded-2xl transition-all duration-200 ${
                selectedImage === image
                  ? "ring-4 ring-[var(--brand-primary)] ring-offset-2"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={image}
                alt={`Photo ${safeImages.indexOf(image) + 1} of ${safeImages.length}`}
                width={240}
                height={160}
                loading="lazy"
                sizes="(max-width: 640px) 25vw, 12vw"
                className="h-20 w-full object-cover sm:h-24"
              />
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 animate-fade-in"
          onClick={() => setFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery fullscreen"
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(false);
            }}
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            ✕
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
              >
                ‹
              </button>

              <div className="relative h-[90vh] w-[90vw]">
                <Image
                  src={selectedImage}
                  alt={title}
                  fill
                  sizes="90vw"
                  className="rounded-2xl object-contain"
                />
              </div>

              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          {safeImages.length === 1 && (
            <div className="relative h-[90vh] w-[90vw]">
              <Image
                src={selectedImage}
                alt={title}
                fill
                sizes="90vw"
                className="rounded-2xl object-contain"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}