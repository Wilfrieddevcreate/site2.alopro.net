"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { confirmDelete, showSuccess } from "@/app/lib/swal";

const PAGE_SIZE = 10;

interface PairData { id: string; base: string; quote: string; _count: { calls: number }; }

export default function PairsPage() {
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const observerRef = useRef<HTMLDivElement>(null);

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary";

  const loadPairs = useCallback(async (skip = 0, append = false, q = search) => {
    if (skip === 0) setLoading(true); else setLoadingMore(true);
    const res = await fetch(`/api/admin/pairs?skip=${skip}&take=${PAGE_SIZE}&search=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (append) setPairs((prev) => [...prev, ...(data.pairs || [])]);
    else setPairs(data.pairs || []);
    setTotal(data.total || 0);
    setHasMore(data.hasMore || false);
    setLoading(false);
    setLoadingMore(false);
  }, [search]);

  useEffect(() => { loadPairs(0, false); }, [loadPairs]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadPairs(pairs.length, true);
      }
    }, { threshold: 0.1 });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, pairs.length, loadPairs]);

  function handleSearch(value: string) {
    setSearch(value);
    loadPairs(0, false, value);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/pairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base: fd.get("base"), quote: fd.get("quote") }),
    });
    setCreating(false);
    if (res.ok) {
      showSuccess("Added", "Trading pair has been added.");
      setShowForm(false);
      loadPairs(0, false);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed");
    }
  }

  async function handleDelete(id: string, base: string, quote: string) {
    const confirmed = await confirmDelete(`${base}/${quote}`);
    if (!confirmed) return;
    const res = await fetch("/api/admin/pairs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showSuccess("Deleted");
      loadPairs(0, false);
    } else {
      const data = await res.json();
      toast.error(data.error || "Cannot delete");
    }
  }

  if (loading) return <div className="pt-8 lg:pt-0 text-white/30 text-sm">Loading...</div>;

  return (
    <div className="pt-8 lg:pt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Trading Pairs <span className="text-white/30 text-lg">({total})</span></h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-glow rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover cursor-pointer">
          {showForm ? "Cancel" : "+ Add Pair"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search pairs (ex: BTC, USDT...)"
          className={inputClass}
        />
      </div>

      {showForm && (
        <form method="POST" onSubmit={handleCreate} className="card-dark p-6 mb-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Base (ex: BTC)</label>
              <input name="base" required placeholder="BTC" maxLength={10} className={inputClass} style={{ textTransform: "uppercase" }} />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Quote (ex: USDT)</label>
              <input name="quote" required placeholder="USDT" maxLength={10} className={inputClass} style={{ textTransform: "uppercase" }} />
            </div>
            <button type="submit" disabled={creating} className="btn-glow rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer">
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      )}

      <div className="card-dark overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-white/5 text-[10px] text-white/25 uppercase tracking-wider font-medium">
          <div>Pair</div>
          <div>Base</div>
          <div>Quote</div>
          <div className="text-right">Calls</div>
        </div>
        <div className="divide-y divide-white/5">
          {pairs.map((p) => (
            <div key={p.id} className="grid grid-cols-4 gap-4 items-center px-5 py-3">
              <div className="text-sm font-bold text-white">{p.base}/{p.quote}</div>
              <div className="text-sm text-white/50">{p.base}</div>
              <div className="text-sm text-white/50">{p.quote}</div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm text-white/30">{p._count.calls}</span>
                {p._count.calls === 0 && (
                  <button onClick={() => handleDelete(p.id, p.base, p.quote)} className="text-red-400/50 hover:text-red-400 cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={observerRef} className="h-1" />}

        {/* No results */}
        {pairs.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-white/30">No pairs found</div>
        )}
      </div>
    </div>
  );
}
