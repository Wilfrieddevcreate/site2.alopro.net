"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { showSuccess } from "@/app/lib/swal";

interface ReferralData { id: string; name: string; date: string; hasSubscription: boolean; }
interface AffData { id: string; status: string; promoCode: string | null; referralLink: string | null; }
interface CommissionData {
  id: string; referredName: string; subscriptionType: string;
  grossAmount: number; commissionAmount: number; commissionRate: number;
  status: string; flagged: boolean; flagReason: string | null;
  maturesAt: string; cancelReason: string | null; createdAt: string;
}
interface StatsData {
  totalEarned: number; pendingAmount: number;
  reviewAmount: number; availableAmount: number;
  withdrawnAmount: number; pendingWithdrawalAmount: number;
  commissions: CommissionData[];
}

export default function AffiliationPage() {
  const [affiliate, setAffiliate] = useState<AffData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [commissionRate, setCommissionRate] = useState(0.10);
  const [securityDays, setSecurityDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"referrals" | "commissions">("referrals");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState<{ id: string; amount: number; paymentMethod: string; status: string; createdAt: string }[]>([]);

  useEffect(() => {
    fetch("/api/user/affiliation").then((r) => r.json()).then((d) => {
      setAffiliate(d.affiliate);
      setReferrals(d.referrals || []);
      setStats(d.stats || null);
      setCommissionRate(d.commissionRate || 0.10);
      setSecurityDays(d.securityDays || 30);
    });
    fetch("/api/user/withdrawal").then((r) => r.json()).then((d) => {
      setWithdrawals(d.requests || []);
      setLoading(false);
    });
  }, []);

  async function requestAffiliation() {
    setRequesting(true);
    const res = await fetch("/api/user/affiliation", { method: "POST" });
    if (res.ok) {
      showSuccess("Request sent", "Your affiliation request has been submitted for review.");
      const d = await res.json();
      setAffiliate(d.affiliate);
    } else {
      toast.error("Failed to send request");
    }
    setRequesting(false);
  }

  function copy(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleWithdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWithdrawing(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/user/withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(fd.get("amount") as string),
        paymentMethod: fd.get("paymentMethod"),
        paymentDetails: fd.get("paymentDetails"),
      }),
    });
    if (res.ok) {
      showSuccess("Request sent", "Your withdrawal request has been submitted.");
      setShowWithdraw(false);
      const d = await fetch("/api/user/withdrawal").then((r) => r.json());
      setWithdrawals(d.requests || []);
      // Refresh stats
      const aff = await fetch("/api/user/affiliation").then((r) => r.json());
      setStats(aff.stats || null);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed");
    }
    setWithdrawing(false);
  }

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Pending" },
      REVIEW: { bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400", label: "Under review" },
      AVAILABLE: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Available" },
      PAID: { bg: "bg-primary/10 border-primary/20", text: "text-primary", label: "Paid" },
      CANCELLED: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: "Cancelled" },
    };
    const s = map[status] || map.PENDING;
    return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${s.bg} ${s.text}`}>{s.label}</span>;
  }

  if (loading) return <div className="pt-8 lg:pt-0 text-white/30 text-sm">Loading...</div>;

  // No affiliate request yet
  if (!affiliate) {
    return (
      <div className="pt-8 lg:pt-0 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Become an affiliate</h2>
        <p className="text-sm text-white/40 max-w-md mb-3">Earn {(commissionRate * 100).toFixed(0)}% commission on every subscription from users you refer.</p>
        <p className="text-xs text-white/20 max-w-sm mb-6">Commissions are held for {securityDays} days before becoming available.</p>
        <button onClick={requestAffiliation} disabled={requesting} className="btn-glow rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
          {requesting ? "Sending..." : "Request to join"}
        </button>
      </div>
    );
  }

  // Pending
  if (affiliate.status === "PENDING") {
    return (
      <div className="pt-8 lg:pt-0 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10">
          <svg className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Request pending</h2>
        <p className="text-sm text-white/40 max-w-md">Your affiliation request is being reviewed. You will be notified once approved.</p>
      </div>
    );
  }

  // Rejected
  if (affiliate.status === "REJECTED") {
    return (
      <div className="pt-8 lg:pt-0 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
          <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Request rejected</h2>
        <p className="text-sm text-white/40 max-w-md">Your affiliation request was not approved. Contact support for more information.</p>
      </div>
    );
  }

  // Approved — full dashboard
  return (
    <div className="pt-8 lg:pt-0">
      <h1 className="text-2xl font-bold text-white mb-6">Affiliation</h1>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Referrals</div>
          <div className="text-xl font-bold text-primary">{referrals.length}</div>
        </div>
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Available</div>
          <div className="text-xl font-bold text-emerald-400">{stats?.availableAmount.toFixed(2) || "0.00"}€</div>
        </div>
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Pending</div>
          <div className="text-xl font-bold text-amber-400">{stats?.pendingAmount.toFixed(2) || "0.00"}€</div>
        </div>
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Withdrawal pending</div>
          <div className="text-xl font-bold text-orange-400">{stats?.pendingWithdrawalAmount?.toFixed(2) || "0.00"}€</div>
        </div>
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Withdrawn</div>
          <div className="text-xl font-bold text-white/50">{stats?.withdrawnAmount?.toFixed(2) || "0.00"}€</div>
        </div>
        <div className="card-dark p-4">
          <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Total earned</div>
          <div className="text-xl font-bold text-white">{stats?.totalEarned.toFixed(2) || "0.00"}€</div>
        </div>
      </div>

      {/* Withdraw button */}
      {(stats?.availableAmount || 0) > 0 && (
        <div className="mb-6">
          <button onClick={() => setShowWithdraw(!showWithdraw)} className="btn-glow rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-all flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
            {showWithdraw ? "Cancel" : "Withdraw funds"}
          </button>
        </div>
      )}

      {/* Withdraw form */}
      {showWithdraw && (
        <form method="POST" onSubmit={handleWithdraw} className="card-dark p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Request withdrawal</h3>
          <p className="text-xs text-white/30">Available: <span className="text-emerald-400 font-semibold">{stats?.availableAmount.toFixed(2)}€</span></p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Amount (€)</label>
              <input name="amount" type="number" step="0.01" min="1" max={stats?.availableAmount || 0} required placeholder="0.00" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Payment method</label>
              <select name="paymentMethod" required className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary">
                <option value="iban" className="bg-black">Bank transfer (IBAN)</option>
                <option value="paypal" className="bg-black">PayPal</option>
                <option value="mobile_money" className="bg-black">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/30 uppercase tracking-wider mb-2">Payment details</label>
              <input name="paymentDetails" required placeholder="IBAN, PayPal email, or phone number" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          <button type="submit" disabled={withdrawing} className="btn-glow rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
            {withdrawing ? "Submitting..." : "Submit request"}
          </button>
        </form>
      )}

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="card-dark overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">Withdrawal history</h3>
          </div>
          <div className="divide-y divide-white/5">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-white">{w.amount.toFixed(2)}€</div>
                  <div className="text-xs text-white/25">{w.paymentMethod} · {new Date(w.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  w.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  w.status === "REJECTED" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  w.status === "APPROVED" ? "bg-primary/10 border-primary/20 text-primary" :
                  "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="card-dark p-4 mb-6 flex items-center gap-3 border-primary/10">
        <svg className="h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-xs text-white/40">
          You earn <span className="text-primary font-semibold">{(commissionRate * 100).toFixed(0)}%</span> on each subscription. Commissions are held for <span className="text-white/60 font-medium">{securityDays} days</span> before becoming available.
        </p>
      </div>

      {/* Promo code & link */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
        {affiliate.promoCode && (
          <div className="card-dark p-5">
            <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Promo Code</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono font-bold text-primary">{affiliate.promoCode}</div>
              <button onClick={() => copy(affiliate.promoCode!, "code")} className="rounded-xl bg-white/5 border border-white/10 p-3 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                {copied === "code" ? <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>}
              </button>
            </div>
          </div>
        )}
        {affiliate.referralLink && (
          <div className="card-dark p-5">
            <div className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Referral Link</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/50 truncate">{affiliate.referralLink}</div>
              <button onClick={() => copy(affiliate.referralLink!, "link")} className="rounded-xl bg-white/5 border border-white/10 p-3 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                {copied === "link" ? <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-3">
        <button onClick={() => setTab("referrals")}
          className={`flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${tab === "referrals" ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-white/40 border border-white/10 hover:text-primary"}`}>
          Referrals
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === "referrals" ? "bg-white/20 text-white" : "bg-white/5 text-white/30"}`}>{referrals.length}</span>
        </button>
        <button onClick={() => setTab("commissions")}
          className={`flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${tab === "commissions" ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-white/5 text-white/40 border border-white/10 hover:text-primary"}`}>
          Commissions
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === "commissions" ? "bg-white/20 text-white" : "bg-white/5 text-white/30"}`}>{stats?.commissions.length || 0}</span>
        </button>
      </div>

      {/* Referrals list */}
      {tab === "referrals" && (
        referrals.length > 0 ? (
          <div className="card-dark overflow-hidden">
            <div className="divide-y divide-white/5">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{ref.name.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-medium text-white">{ref.name}</div>
                      <div className="text-xs text-white/25">{new Date(ref.date).toLocaleDateString("en-GB")}</div>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${ref.hasSubscription ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                    {ref.hasSubscription ? "Subscribed" : "Trial"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-white/30">No referrals yet. Share your code to start earning!</p>
          </div>
        )
      )}

      {/* Commissions list */}
      {tab === "commissions" && (
        stats && stats.commissions.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block card-dark overflow-hidden overflow-x-auto">
              <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-white/5 text-[10px] text-white/25 uppercase tracking-wider font-medium">
                <div>Referral</div>
                <div>Plan</div>
                <div className="text-right">Payment</div>
                <div className="text-right">Commission</div>
                <div className="text-center">Status</div>
                <div className="text-right">Matures</div>
              </div>
              <div className="divide-y divide-white/5">
                {stats.commissions.map((c) => (
                  <div key={c.id} className="grid grid-cols-6 gap-4 items-center px-5 py-4">
                    <div className="text-sm font-medium text-white">{c.referredName}</div>
                    <div className="text-xs text-white/40">{c.subscriptionType}</div>
                    <div className="text-right text-sm text-white/50">{c.grossAmount.toFixed(2)}€</div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-primary">{c.commissionAmount.toFixed(2)}€</span>
                      <span className="text-xs text-white/20 ml-1">({(c.commissionRate * 100).toFixed(0)}%)</span>
                    </div>
                  <div className="text-center flex items-center justify-center gap-1.5">
                    {statusBadge(c.status)}
                    {c.flagged && (
                      <span title={c.flagReason || "Flagged"} className="cursor-help">
                        <svg className="h-3.5 w-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs text-white/25">
                    {c.status === "CANCELLED" ? (c.cancelReason || "—") : new Date(c.maturesAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {stats.commissions.map((c) => (
              <div key={c.id} className="card-dark p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">{c.referredName}</div>
                  {statusBadge(c.status)}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/30">{c.subscriptionType}</span>
                  <span className="text-sm text-white/50">{c.grossAmount.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">{c.commissionAmount.toFixed(2)}€ <span className="text-xs text-white/20">({(c.commissionRate * 100).toFixed(0)}%)</span></span>
                  <span className="text-xs text-white/25">{c.status === "CANCELLED" ? (c.cancelReason || "—") : new Date(c.maturesAt).toLocaleDateString("en-GB")}</span>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-white/30">No commissions yet. Commissions appear when your referrals subscribe.</p>
          </div>
        )
      )}

      {/* Review notice */}
      {stats && stats.reviewAmount > 0 && (
        <div className="mt-6 card-dark p-4 flex items-center gap-3 border-orange-500/20">
          <svg className="h-5 w-5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-white/40">
            <span className="text-orange-400 font-semibold">{stats.reviewAmount.toFixed(2)}€</span> in commissions are under review by the admin due to potential fraud detection.
          </p>
        </div>
      )}
    </div>
  );
}
