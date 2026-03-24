"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { confirmAction, showSuccess } from "@/app/lib/swal";

const PAGE_SIZE = 20;

interface AffData { id: string; userName: string; userEmail: string; status: string; promoCode: string | null; referralCount: number; createdAt: string; }

export default function AffiliationsAdmin() {
  const [affiliates, setAffiliates] = useState<AffData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initialLoaded = useRef(false);

  const fetchAffiliates = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliations?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`);
      const data = await res.json();
      const items: AffData[] = data.items || [];
      setTotal(data.total || 0);
      if (append) setAffiliates((prev) => [...prev, ...items]);
      else setAffiliates(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialLoaded.current) { initialLoaded.current = true; fetchAffiliates(0, false); }
  }, [fetchAffiliates]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        pageRef.current += 1;
        fetchAffiliates(pageRef.current, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchAffiliates]);

  function reload() { pageRef.current = 0; fetchAffiliates(0, false); }

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    const confirmed = await confirmAction(
      status === "APPROVED" ? "Approve affiliate?" : "Reject affiliate?",
      status === "APPROVED" ? "A promo code will be generated for this user." : "This affiliate request will be rejected."
    );
    if (!confirmed) return;
    await fetch("/api/admin/affiliations", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    showSuccess(status === "APPROVED" ? "Approved" : "Rejected");
    reload();
  }

  const pending = affiliates.filter((a) => a.status === "PENDING");
  const others = affiliates.filter((a) => a.status !== "PENDING");

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">Affiliations <span className="text-white/30 text-lg">({total})</span></h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="card-dark p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-white">{a.userName}</div>
                  <div className="text-xs text-white/25">{a.userEmail} — {new Date(a.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(a.id, "APPROVED")} className="rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors">Approve</button>
                  <button onClick={() => handleAction(a.id, "REJECTED")} className="rounded-xl bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-colors">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">All Affiliates</h2>
        </div>
        <div className="divide-y divide-white/5">
          {others.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-medium text-white">{a.userName}</div>
                <div className="text-xs text-white/25">{a.userEmail}</div>
              </div>
              <div className="flex items-center gap-3">
                {a.promoCode && <span className="text-xs font-mono text-primary">{a.promoCode}</span>}
                <span className="text-xs text-white/20">{a.referralCount} referrals</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  a.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>{a.status}</span>
              </div>
            </div>
          ))}
          {others.length === 0 && !loading && <div className="px-5 py-8 text-center text-sm text-white/30">No affiliates yet</div>}
        </div>
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
      {!hasMore && affiliates.length > 0 && <p className="text-center text-xs text-white/20 py-4">All affiliates loaded</p>}
    </div>
  );
}
