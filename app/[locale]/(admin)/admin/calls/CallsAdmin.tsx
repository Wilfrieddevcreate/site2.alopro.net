"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { confirmDelete, showSuccess, showError } from "@/app/lib/swal";
import Swal from "sweetalert2";

const PAGE_SIZE = 20;

interface CallData {
  id: string; pair: string; tradingPairId: string; entryMin: number; entryMax: number;
  stopLoss: number; active: boolean; targets: { id: string; rank: number; price: number; reached: boolean }[];
  createdAt: string;
}

export default function CallsAdmin({ pairs: initialPairs }: { pairs: { id: string; label: string }[] }) {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [targets, setTargets] = useState([{ rank: 1, price: "" }]);
  const [markingTp, setMarkingTp] = useState<string | null>(null);
  const [pairs, setPairs] = useState(initialPairs);
  const [pairSearch, setPairSearch] = useState("");
  const [selectedPairId, setSelectedPairId] = useState(initialPairs[0]?.id || "");
  const [showPairDropdown, setShowPairDropdown] = useState(false);
  const [addingPair, setAddingPair] = useState(false);

  const filteredPairs = pairSearch
    ? pairs.filter((p) => p.label.toLowerCase().includes(pairSearch.toLowerCase()))
    : pairs;

  async function handleAddNewPair() {
    const parts = pairSearch.toUpperCase().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      toast.error("Format: BASE/QUOTE (ex: DOGE/USDT)");
      return;
    }
    setAddingPair(true);
    const res = await fetch("/api/admin/pairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base: parts[0], quote: parts[1] }),
    });
    if (res.ok) {
      const data = await res.json();
      const newPair = { id: data.pair.id, label: `${parts[0]}/${parts[1]}` };
      setPairs((prev) => [...prev, newPair].sort((a, b) => a.label.localeCompare(b.label)));
      setSelectedPairId(data.pair.id);
      setPairSearch(newPair.label);
      setShowPairDropdown(false);
      toast.success(`${newPair.label} added!`);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add pair");
    }
    setAddingPair(false);
  }
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const initialLoaded = useRef(false);

  const fetchCalls = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calls?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`);
      const data = await res.json();
      const items: CallData[] = (data.items || []).map((c: { id: string; tradingPair: { base: string; quote: string }; tradingPairId: string; entryMin: number; entryMax: number; stopLoss: number; active: boolean; createdAt: string; targets: { id: string; rank: number; price: number; reached: boolean }[] }) => ({
        id: c.id, pair: `${c.tradingPair.base}/${c.tradingPair.quote}`, tradingPairId: c.tradingPairId,
        entryMin: c.entryMin, entryMax: c.entryMax, stopLoss: c.stopLoss, active: c.active,
        targets: c.targets, createdAt: c.createdAt,
      }));
      setTotal(data.total || 0);
      if (append) setCalls((prev) => [...prev, ...items]);
      else setCalls(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialLoaded.current) { initialLoaded.current = true; fetchCalls(0, false); }
  }, [fetchCalls]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        pageRef.current += 1;
        fetchCalls(pageRef.current, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchCalls]);

  function reload() { pageRef.current = 0; fetchCalls(0, false); }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tradingPairId: fd.get("pair"), entryMin: fd.get("entryMin"),
        entryMax: fd.get("entryMax"), stopLoss: fd.get("stopLoss"), active: true,
        targets: targets.map((t, i) => ({ rank: i + 1, price: t.price })),
      }),
    });
    setCreating(false);
    setShowForm(false);
    setTargets([{ rank: 1, price: "" }]);
    showSuccess("Call created", "The trading signal has been published.");
    reload();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/admin/calls", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    toast.success(active ? "Call deactivated" : "Call activated");
    reload();
  }

  async function deleteCall(id: string) {
    const confirmed = await confirmDelete("this call");
    if (!confirmed) return;
    const res = await fetch("/api/admin/calls", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (res.ok) showSuccess("Deleted", "Call has been removed.");
    else showError("Error", "Failed to delete call.");
    reload();
  }

  async function markTpReached(targetId: string, pair: string, rank: number, price: number) {
    const result = await Swal.fire({
      title: `Mark TP${rank} as reached?`,
      html: `<p style="color:#999;font-size:14px;"><b>${pair}</b> — TP${rank} at <b>${price}</b></p><p style="color:#666;font-size:12px;margin-top:8px;">This will notify all users via bell, push notification, and Telegram.</p>`,
      icon: "question", showCancelButton: true, confirmButtonColor: "#10b981",
      cancelButtonColor: "#333", confirmButtonText: "Yes, TP reached!", cancelButtonText: "Cancel",
      background: "#141419", color: "#fff",
    });
    if (!result.isConfirmed) return;
    setMarkingTp(targetId);
    const res = await fetch("/api/admin/calls/tp-reached", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId }),
    });
    setMarkingTp(null);
    if (res.ok) {
      showSuccess(`TP${rank} Reached!`, `Users have been notified.`);
      reload();
    } else {
      const data = await res.json();
      showError("Error", data.error || "Failed to mark TP");
    }
  }

  const inputClass = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary";

  return (
    <div className="pt-8 lg:pt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Calls <span className="text-white/30 text-lg">({total})</span></h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-glow rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          {showForm ? "Cancel" : "+ New Call"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card-dark p-6 mb-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div className="relative">
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Pair</label>
              <input type="hidden" name="pair" value={selectedPairId} />
              <input
                type="text"
                value={pairSearch}
                onChange={(e) => { setPairSearch(e.target.value); setShowPairDropdown(true); }}
                onFocus={() => setShowPairDropdown(true)}
                placeholder="Search or type BTC/USDT..."
                className={inputClass}
                autoComplete="off"
              />
              {showPairDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-[#0a0a0a] border border-white/10 max-h-48 overflow-y-auto shadow-xl">
                  {filteredPairs.map((p) => (
                    <button key={p.id} type="button" onClick={() => { setSelectedPairId(p.id); setPairSearch(p.label); setShowPairDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${selectedPairId === p.id ? "text-primary font-semibold" : "text-white/70"}`}>
                      {p.label}
                    </button>
                  ))}
                  {filteredPairs.length === 0 && pairSearch.includes("/") && (
                    <button type="button" onClick={handleAddNewPair} disabled={addingPair}
                      className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      {addingPair ? "Adding..." : `Add "${pairSearch.toUpperCase()}" as new pair`}
                    </button>
                  )}
                  {filteredPairs.length === 0 && !pairSearch.includes("/") && (
                    <div className="px-4 py-3 text-xs text-white/25">Type BASE/QUOTE to add a new pair</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Entry Min</label>
              <input name="entryMin" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Entry Max</label>
              <input name="entryMax" type="number" step="any" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Stop Loss</label>
              <input name="stopLoss" type="number" step="any" required className={inputClass} />
            </div>
          </div>
          <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Take Profits</label>
          <div className="space-y-2 mb-4">
            {targets.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs text-white/40 w-8">TP{i + 1}</span>
                <input type="number" step="any" value={t.price} onChange={(e) => { const n = [...targets]; n[i].price = e.target.value; setTargets(n); }} required placeholder="Price" className={`${inputClass} flex-1`} />
                {i > 0 && <button type="button" onClick={() => setTargets(targets.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={() => setTargets([...targets, { rank: targets.length + 1, price: "" }])} className="text-xs text-primary hover:text-primary-hover">+ Add TP</button>
          </div>
          <button type="submit" disabled={creating} className="btn-glow rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
            {creating ? "Creating..." : "Create Call"}
          </button>
        </form>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {calls.map((call) => (
          <div key={call.id} className="card-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-white">{call.pair}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(call.id, call.active)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${call.active ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>
                  {call.active ? "Active" : "Off"}
                </button>
                <button onClick={() => deleteCall(call.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
            <div className="text-xs text-white/30 mb-3">Entry: {call.entryMin} — {call.entryMax} | SL: {call.stopLoss}</div>
            <div className="space-y-2">
              {call.targets.map((tp) => (
                <div key={tp.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${tp.reached ? "bg-emerald-500/10 border border-emerald-500/15" : "bg-white/[0.03] border border-white/5"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${tp.reached ? "text-emerald-400" : "text-white/50"}`}>TP{tp.rank}</span>
                    <span className={`text-sm font-bold ${tp.reached ? "text-emerald-400" : "text-white"}`}>{tp.price}</span>
                  </div>
                  {tp.reached ? (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">Reached</span>
                    </div>
                  ) : (
                    <button onClick={() => markTpReached(tp.id, call.pair, tp.rank, tp.price)} disabled={markingTp === tp.id}
                      className="rounded-lg bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-50">
                      {markingTp === tp.id ? "..." : "Mark reached"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-white/15 mt-3">{new Date(call.createdAt).toLocaleDateString("en-GB")}</div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loading && <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
      {!hasMore && calls.length > 0 && <p className="text-center text-xs text-white/20 py-4">All calls loaded</p>}
    </div>
  );
}
