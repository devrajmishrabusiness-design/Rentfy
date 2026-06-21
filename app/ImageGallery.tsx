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
    return null;
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
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Photos</h2>

        <span className="text-gray-500">{images.length} Photos</span>
      </div>

      <Image
        src={selectedImage}
        alt={title}
        width={1200}
        height={675}
        unoptimized
        onClick={() => setFullscreen(true)}
        className="h-[450px] w-full cursor-pointer rounded-xl object-cover shadow"
      />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {images.map((image) => (
          <Image
            key={image}
            src={image}
            alt={title}
            width={240}
            height={160}
            unoptimized
            onClick={() => setSelectedImage(image)}
            className={`h-24 w-full cursor-pointer rounded-lg object-cover hover:opacity-80 ${
              selectedImage === image ? "border-4 border-blue-600" : "border"
            }`}
          />
        ))}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 text-5xl text-white"
          >
            &lsaquo;
          </button>

          <Image
            src={selectedImage}
            alt={title}
            width={1600}
            height={1000}
            unoptimized
            className="max-h-[95%] max-w-[95%] object-contain"
          />

          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 text-5xl text-white"
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
