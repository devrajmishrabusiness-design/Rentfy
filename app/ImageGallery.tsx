"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const [fullscreen, setFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="mb-10 grid h-72 w-full place-items-center rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50 text-sm font-medium text-[var(--brand-muted)]">
        No photos available
      </div>
    );
  }

  const currentIndex = images.indexOf(selectedImage);

  const nextImage = () => {
    setSelectedImage(images[(currentIndex + 1) % images.length]);
  };

  const prevImage = () => {
    setSelectedImage(
      images[(currentIndex - 1 + images.length) % images.length]
    );
  };

  return (
    <div className="mb-10">
      <div className="relative overflow-hidden rounded-3xl bg-stone-100">
        <Image
          src={selectedImage}
          alt={title}
          width={1600}
          height={900}
          unoptimized
          priority
          onClick={() => setFullscreen(true)}
          className="h-[420px] w-full cursor-pointer object-cover transition-transform duration-500 hover:scale-[1.01] sm:h-[480px]"
        />

        <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          {currentIndex + 1} / {images.length}
        </div>

        {images.length > 1 && (
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

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((image) => (
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
                alt={`Photo ${images.indexOf(image) + 1} of ${images.length}`}
                width={240}
                height={160}
                unoptimized
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
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(false);
            }}
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            ✕
          </button>

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

          <Image
            src={selectedImage}
            alt={title}
            width={1600}
            height={1000}
            unoptimized
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
          />

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
        </div>
      )}
    </div>
  );
}