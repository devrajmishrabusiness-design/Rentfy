"use client";

import { useState } from "react";

export default function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  if (!images || images.length === 0) {
    return null;
  }

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [fullscreen, setFullscreen] = useState(false);
  const currentIndex = images.indexOf(selectedImage);

  const nextImage = () => {
   setSelectedImage(
     images[(currentIndex + 1) % images.length]
   );
 };

  const prevImage = () => {
   setSelectedImage(
     images[
       (currentIndex - 1 + images.length) %
       images.length
     ]
   );
 };
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">
          Photos
        </h2>

        <span className="text-gray-500">
          {images.length} Photos
        </span>
      </div>

      <img
        src={selectedImage}
        alt={title}
        onClick={() => setFullscreen(true)}
        className="w-full h-[450px] object-cover rounded-xl shadow cursor-pointer"
      />

      <div className="grid grid-cols-4 gap-2 mt-4">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={title}
            onClick={() => setSelectedImage(image)}
            className={`h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-80 ${
              selectedImage === image
                ? "border-4 border-blue-600"
                : "border"
            }`}
          />
        ))}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setFullscreen(false)}
        >
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 text-white text-5xl"
            >
              ‹
            </button>

            <img
             src={selectedImage}
             alt={title}
             className="max-w-[95%] max-h-[95%] object-contain"
           />

           <button
             onClick={(e) => {
               e.stopPropagation();
               nextImage();
             }}
             className="absolute right-4 text-white text-5xl"
            >
              ›
           </button>
        </>
        </div>
      )}
    </div>
  );
}