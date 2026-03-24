"use client";

import { useState } from "react";
import { useRouter } from "@/app/i18n/navigation";

interface Props {
  title: string;
  description: string;
  images: string[];
  date: string;
}

export default function NewsDetailClient({ title, description, images, date }: Props) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="pt-8 lg:pt-0 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back
      </button>

      {/* Images gallery */}
      {images.length > 0 && (
        <div className="mb-6">
          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden bg-white/5 mb-3 cursor-pointer" onClick={() => setLightbox(true)}>
            <img src={images[activeImage]} alt={title} className="w-full max-h-[500px] object-cover" />
            <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] text-white/70">
              {activeImage + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? "border-primary" : "border-white/10 opacity-60 hover:opacity-100"}`}
                >
                  <img src={url} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="card-dark p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-white/25">{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">{title}</h1>
        <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{description}</div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightbox(false)}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length); }}
                className="absolute left-4 text-white/60 hover:text-white">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length); }}
                className="absolute right-4 text-white/60 hover:text-white">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </>
          )}

          <img src={images[activeImage]} alt={title} className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
