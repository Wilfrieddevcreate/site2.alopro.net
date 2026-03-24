"use client";

import { useState, useEffect, useCallback } from "react";

interface NewsDetail {
  id: string;
  title: string;
  description: string;
  images: string[];
  date: string;
}

interface Props {
  news: NewsDetail | null;
  onClose: () => void;
}

export default function NewsDetailModal({ news, onClose }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Reset image index when news changes
  useEffect(() => {
    setActiveImage(0);
    setIsClosing(false);
  }, [news?.id]);

  // Auto-slide images every 4s if more than 1
  useEffect(() => {
    if (!news || news.images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % news.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [news]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 250);
  }, [onClose]);

  if (!news) return null;

  const hasMultipleImages = news.images.length > 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-250 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />

      {/* Desktop: centered modal */}
      <div className={`fixed inset-0 z-50 hidden sm:flex items-center justify-center p-6 pointer-events-none transition-all duration-250 ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
        <div className="pointer-events-auto w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={handleClose} className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white/50 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Images */}
          {news.images.length > 0 && (
            <div className="relative shrink-0">
              <div className="relative h-72 overflow-hidden">
                {news.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${news.title} ${i + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === activeImage ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>

              {/* Dots indicator */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {news.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeImage ? "w-6 bg-primary" : "w-1.5 bg-white/30"}`}
                    />
                  ))}
                </div>
              )}

              {/* Arrows */}
              {hasMultipleImages && (
                <>
                  <button onClick={() => setActiveImage((p) => (p - 1 + news.images.length) % news.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/60 hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button onClick={() => setActiveImage((p) => (p + 1) % news.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/60 hover:text-white transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-xs text-white/25 mb-3">
              {new Date(news.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-xl font-bold text-white mb-4">{news.title}</h2>
            <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{news.description}</div>
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-50 sm:hidden transition-transform duration-300 ease-out ${isClosing ? "translate-y-full" : "translate-y-0"}`}>
        <div className="rounded-t-2xl bg-[#0a0a0a] border-t border-white/10 max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <div className="flex justify-center py-3 cursor-pointer" onClick={handleClose}>
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* Images */}
          {news.images.length > 0 && (
            <div className="relative shrink-0">
              <div className="relative h-48 overflow-hidden">
                {news.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${news.title} ${i + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === activeImage ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>

              {/* Dots */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {news.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeImage ? "w-6 bg-primary" : "w-1.5 bg-white/30"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <p className="text-xs text-white/25 mb-2">
              {new Date(news.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h2 className="text-lg font-bold text-white mb-3">{news.title}</h2>
            <div className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{news.description}</div>
          </div>
        </div>
      </div>
    </>
  );
}
