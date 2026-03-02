'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [errored, setErrored] = useState<Set<number>>(new Set());

  const total = images.length;
  const hasMultiple = total > 1;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  const handleError = (idx: number) => {
    setErrored((prev) => new Set(prev).add(idx));
  };

  const validImages = images.filter((_, i) => !errored.has(i));
  if (validImages.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-elevated)] flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" className="opacity-20">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative select-none">
      {/* Main image */}
      <div className="relative overflow-hidden bg-[var(--bg-secondary)]">
        {images.map((src, idx) => (
          <div
            key={idx}
            className={`${idx === current ? 'block' : 'hidden'}`}
          >
            {errored.has(idx) ? null : (
              <img
                src={src}
                alt={`Image ${idx + 1}`}
                className="w-full object-cover max-h-[620px]"
                onError={() => handleError(idx)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition z-10"
            aria-label="Previous image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition z-10"
            aria-label="Next image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Counter badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium z-10">
            {current + 1} / {total}
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`rounded-full transition-all ${
                  idx === current
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
