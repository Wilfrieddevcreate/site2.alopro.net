"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import NewsDetailModal from "@/app/[locale]/components/NewsDetailModal";

const PAGE_SIZE = 20;

interface NewsData { id: string; title: string; description: string; imageUrl: string; createdAt: string; imageCount?: number; images?: string[]; }

export default function NewsClient() {
  const locale = useLocale();
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string; description: string; images: string[]; date: string } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initialLoaded = useRef(false);

  const fetchNews = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/news?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}&locale=${locale}`);
      const data = await res.json();
      const items: NewsData[] = data.items || [];
      if (append) setNews((prev) => [...prev, ...items]);
      else setNews(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* ignore */ }
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    if (!initialLoaded.current) { initialLoaded.current = true; fetchNews(0, false); }
  }, [fetchNews]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        pageRef.current += 1;
        fetchNews(pageRef.current, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchNews]);

  async function openNewsDetail(n: NewsData) {
    setLoadingDetail(n.id);
    try {
      const res = await fetch(`/api/user/news/${n.id}?locale=${locale}`);
      const data = await res.json();
      setSelectedNews({
        id: n.id,
        title: data.title || n.title,
        description: data.description || n.description,
        images: data.images || (n.imageUrl ? [n.imageUrl] : []),
        date: n.createdAt,
      });
    } catch {
      // Fallback to card data
      setSelectedNews({
        id: n.id,
        title: n.title,
        description: n.description,
        images: n.imageUrl ? [n.imageUrl] : [],
        date: n.createdAt,
      });
    }
    setLoadingDetail(null);
  }

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">News</h1>

      {!loading && news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>
          <p className="text-sm text-white/30">No news available.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {news.map((n) => (
            <div key={n.id} onClick={() => openNewsDetail(n)} className="card-dark overflow-hidden group cursor-pointer hover:border-primary/20 transition-all">
              <div className="h-44 bg-white/5 overflow-hidden relative">
                <img src={n.imageUrl} alt={n.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                {(n.imageCount || 0) > 1 && (
                  <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    +{(n.imageCount || 1) - 1}
                  </span>
                )}
                {loadingDetail === n.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-white leading-snug">{n.title}</h3>
                <p className="mt-2 text-sm text-white/40 line-clamp-2 leading-relaxed">{n.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-white/20">{n.createdAt.split("T")[0]}</p>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Read more →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
      {!hasMore && news.length > 0 && <p className="text-center text-xs text-white/20 py-4">All news loaded</p>}

      {/* News Detail Modal */}
      <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
