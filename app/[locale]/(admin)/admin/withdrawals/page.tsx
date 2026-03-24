"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

interface WithdrawalItem {
  id: string; amount: number; paymentMethod: string; paymentDetails: string;
  status: string; adminNote: string | null; processedAt: string | null;
  createdAt: string; userName: string; userEmail: string;
}

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/withdrawal-requests");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, status: string, label: string) {
    let adminNote = "";

    if (status === "REJECTED") {
      const result = await Swal.fire({
        title: "Reject withdrawal?",
        input: "text",
        inputLabel: "Reason (optional)",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Reject",
        background: "#111",
        color: "#fff",
      });
      if (!result.isConfirmed) return;
      adminNote = result.value || "";
    } else {
      const result = await Swal.fire({
        title: `${label}?`,
        text: status === "COMPLETED" ? "Confirm that you have sent the payment." : `Mark as ${label.toLowerCase()}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#14708E",
        confirmButtonText: `Yes, ${label.toLowerCase()}`,
        background: "#111",
        color: "#fff",
      });
      if (!result.isConfirmed) return;
    }

    const res = await fetch("/api/admin/withdrawal-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNote }),
    });

    if (res.ok) {
      toast.success(`Withdrawal ${label.toLowerCase()}`);
      load();
    } else {
      toast.error("Failed");
    }
  }

  const methodLabel: Record<string, string> = { iban: "Bank Transfer", paypal: "PayPal", mobile_money: "Mobile Money" };

  if (loading) return <div className="pt-8 lg:pt-0 text-white/30 text-sm">Loading...</div>;

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">Withdrawal Requests</h1>

      {items.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <p className="text-sm text-white/30">No withdrawal requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((w) => (
            <div key={w.id} className="card-dark p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-400">{w.userName.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{w.userName}</div>
                      <div className="text-xs text-white/25">{w.userEmail}</div>
                    </div>
                  </div>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mt-3">
                    <div>
                      <div className="text-[10px] text-white/20 uppercase tracking-wider">Amount</div>
                      <div className="text-lg font-bold text-emerald-400">{w.amount.toFixed(2)}€</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/20 uppercase tracking-wider">Method</div>
                      <div className="text-sm text-white/60">{methodLabel[w.paymentMethod] || w.paymentMethod}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/20 uppercase tracking-wider">Details</div>
                      <div className="text-sm text-white/60 truncate max-w-[200px]" title={w.paymentDetails}>{w.paymentDetails}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/20 uppercase tracking-wider">Date</div>
                      <div className="text-sm text-white/40">{new Date(w.createdAt).toLocaleDateString("en-GB")}</div>
                    </div>
                  </div>
                  {w.adminNote && <p className="mt-2 text-xs text-white/25 italic">Note: {w.adminNote}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${
                    w.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    w.status === "REJECTED" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    w.status === "APPROVED" ? "bg-primary/10 border-primary/20 text-primary" :
                    "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>{w.status}</span>

                  <div className="flex gap-2">
                    {w.status === "PENDING" && (
                      <>
                        <button onClick={() => handleAction(w.id, "APPROVED", "Approve")} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 cursor-pointer">Approve</button>
                        <button onClick={() => handleAction(w.id, "REJECTED", "Reject")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 cursor-pointer">Reject</button>
                      </>
                    )}
                    {w.status === "APPROVED" && (
                      <button onClick={() => handleAction(w.id, "COMPLETED", "Complete")} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer">Mark as paid</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
