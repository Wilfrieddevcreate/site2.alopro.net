"use client";

import { useState } from "react";

interface SubData {
  id: string;
  userName: string;
  userEmail: string;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  invoiceNumber: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  active: number;
  signals: number;
  managed: number;
  revenue: number;
}

export default function SubsClient({ stats, subscriptions }: { stats: Stats; subscriptions: SubData[] }) {
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "EXPIRED" | "CANCELLED">("all");

  const filtered = filter === "all" ? subscriptions : subscriptions.filter((s) => s.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-400";
      case "CANCELLED": return "bg-red-500/10 text-red-400";
      case "PAST_DUE": return "bg-amber-500/10 text-amber-400";
      default: return "bg-white/5 text-white/30";
    }
  };

  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <div className="card-dark p-5">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="card-dark p-5">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Active</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
        </div>
        <div className="card-dark p-5">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Signals</div>
          <div className="text-2xl font-bold text-primary">{stats.signals}</div>
        </div>
        <div className="card-dark p-5">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Managed</div>
          <div className="text-2xl font-bold text-purple-400">{stats.managed}</div>
        </div>
        <div className="card-dark p-5">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-1">Revenue</div>
          <div className="text-2xl font-bold text-white">{stats.revenue.toFixed(2)}€</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "ACTIVE", "EXPIRED", "CANCELLED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === f ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">User</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">Period</th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-white/30 uppercase tracking-wider">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-white">{s.userName}</div>
                      <div className="text-xs text-white/25">{s.userEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${s.type === "MANAGED" ? "bg-purple-500/10 text-purple-400" : "bg-primary/10 text-primary"}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">{s.amount.toFixed(2)}€</td>
                    <td className="px-5 py-4 text-xs text-white/40">
                      {new Date(s.periodStart).toLocaleDateString("en-GB")} — {new Date(s.periodEnd).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-primary">{s.invoiceNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-white/30">No subscriptions found.</p>
        </div>
      )}
    </div>
  );
}
